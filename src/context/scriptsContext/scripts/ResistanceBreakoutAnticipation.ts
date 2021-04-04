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
  params,
}: ScriptFuncParameters) {
  if (balance < 0) return;

  void params;

  const priceAdjustment = 1; // 1/100000;
  const candlesAmountWithLowerPriceToBeConsideredTop = 18;

  const riskPercentage = 1.5;
  const stopLossDistance = 12 * priceAdjustment;
  const takeProfitDistance = 27 * priceAdjustment;
  const tpDistanceShortForBreakEvenSL = 5 * priceAdjustment;

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
        hour: "9:00",
        weekdays: [1, 2, 3, 5],
      },
      {
        hour: "10:00",
        weekdays: [1, 2, 3, 5],
      },
      {
        hour: "11:30",
        weekdays: [1, 2, 3, 5],
      },
      {
        hour: "12:00",
        weekdays: [1, 2, 3, 5],
      },
      {
        hour: "12:30",
        weekdays: [1, 2, 3, 5],
      },
      {
        hour: "20:30",
        weekdays: [1, 2, 3, 5],
      },
    ],
    [],
    [0, 2, 3, 4, 5, 7, 8, 9],
    date
  );
  //const isValidTime = isWithinTime([], params!.validDays!, [], date);
  //const isValidTime = isWithinTime([], [], params!.validMonths!, date);
  //const isValidTime = isWithinTime(params!.validHours!, [], [], date);

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market" && o.position === "long");
    if (order) {
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      if (order.price > candles[currentDataIndex].high + spreadAdjustment) {
        createOrder(order);
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder && marketOrder.position === "long") {
    if (marketOrder.takeProfit! - candles[currentDataIndex].high < tpDistanceShortForBreakEvenSL) {
      marketOrder.stopLoss = marketOrder.price;
    }
  }

  if (marketOrder) return;

  const horizontalLevelCandleIndex = currentDataIndex - candlesAmountWithLowerPriceToBeConsideredTop;
  if (horizontalLevelCandleIndex < 0 || currentDataIndex < candlesAmountWithLowerPriceToBeConsideredTop * 2) {
    return;
  }

  let isFalsePositive = false;
  for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex - 1; j++) {
    if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
      isFalsePositive = true;
      break;
    }
  }

  if (isFalsePositive) return;

  isFalsePositive = false;
  for (
    let j = horizontalLevelCandleIndex - candlesAmountWithLowerPriceToBeConsideredTop;
    j < horizontalLevelCandleIndex;
    j++
  ) {
    if (!candles[j]) continue;
    if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
      isFalsePositive = true;
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].high - 2 * priceAdjustment;
  if (price > candles[currentDataIndex].high + spreadAdjustment) {
    orders.filter((o) => o.type !== "market" && o.position === "long").map((nmo) => closeOrder(nmo.id!));
    let lowestValue = candles[currentDataIndex].low;

    for (let i = currentDataIndex; i > currentDataIndex - 180; i--) {
      if (!candles[i]) break;

      if (candles[i].low < lowestValue) {
        lowestValue = candles[i].low;
      }
    }

    const diff = candles[currentDataIndex].low - lowestValue;
    if (diff < 10) {
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price - stopLossDistance;
    const takeProfit = price + takeProfitDistance;
    const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance + 1) || 1;
    // const size = (Math.floor((balance * (riskPercentage / 100) / stopLossDistance) / 100000) * 100000) / 10;

    const o = {
      type: "buy-stop" as OrderType,
      position: "long" as Position,
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
  isWithinTime,
  params
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
