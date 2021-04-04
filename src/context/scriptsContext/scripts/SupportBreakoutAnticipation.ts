import { ScriptFuncParameters } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";

export default (function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  spreadAdjustment,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
}: ScriptFuncParameters) {
  if (balance < 0) return;

  const priceAdjustment = 1; // 1/100000;
  const candlesAmountWithLowerPriceToBeConsideredBottom = 14;

  const riskPercentage = 1.5;
  const stopLossDistance = 12 * priceAdjustment;
  const takeProfitDistance = 27 * priceAdjustment;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() >= 21) {
    if (date.getHours() === 21 && date.getMinutes() === 58) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
    if (date.getHours() !== 21) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
  }
  const isValidTime = isWithinTime(
    [
      {
        hour: "8:30",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "9:00",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "12:00",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "13:00",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "14:30",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "15:30",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "18:00",
        weekdays: [1, 2, 4, 5],
      },
    ],
    [],
    [2, 3, 5, 8, 11],
    date
  );

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market" && o.position === "short");
    if (order) {
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      if (order.price < candles[currentDataIndex].low - spreadAdjustment) {
        createOrder(order);
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder && marketOrder.position === "short") {
    if (candles[currentDataIndex].low - marketOrder.takeProfit! < 5 * priceAdjustment) {
      marketOrder.stopLoss = marketOrder.price;
    }
  }

  if (marketOrder) return;

  const horizontalLevelCandleIndex = currentDataIndex - candlesAmountWithLowerPriceToBeConsideredBottom;
  if (horizontalLevelCandleIndex < 0 || currentDataIndex < candlesAmountWithLowerPriceToBeConsideredBottom * 2) {
    return;
  }

  let isFalsePositive = false;
  for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
      isFalsePositive = true;
      break;
    }
  }

  if (isFalsePositive) return;

  isFalsePositive = false;
  for (
    let j = horizontalLevelCandleIndex - candlesAmountWithLowerPriceToBeConsideredBottom;
    j < horizontalLevelCandleIndex;
    j++
  ) {
    if (!candles[j]) continue;
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
      isFalsePositive = true;
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].low + 2 * priceAdjustment;
  if (price < candles[currentDataIndex].low - spreadAdjustment) {
    orders.filter((o) => o.type !== "market" && o.position === "short").map((nmo) => closeOrder(nmo.id!));
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - 120; i--) {
      if (!candles[i]) break;

      if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
      }
    }

    const diff = highestValue - candles[currentDataIndex].high;
    if (diff < 29) {
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price + stopLossDistance;
    const takeProfit = price - takeProfitDistance;
    const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance + 1) || 1;
    // const size = (Math.floor((balance * (riskPercentage / 100) / stopLossDistance) / 100000) * 100000) / 10;

    const o = {
      type: "sell-stop" as OrderType,
      position: "short" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
    };
    if (!isValidTime) {
      persistedVars.pendingOrder = o;
    } else {
      createOrder(o);
    }
  }

  // end script
}
  .toString()
  .replace(
    `
function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  spreadAdjustment,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
