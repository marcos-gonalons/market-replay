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
  void params;

  if (balance < 0) return;

  const priceAdjustment = 1 / 10000; // 1/10000;
  const candlesToCheck = 1000;
  const ignoreLastNCandles = 14;
  const candlesAmountWithLowerPriceToBeConsideredBottom = 14;
  const candlesAmountWithoutOtherBottoms = 0;
  const riskPercentage = 1.5;
  const stopLossDistance = 23 * priceAdjustment;
  const takeProfitDistance = 11 * priceAdjustment;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  /*
  if (date.getHours() < 8 || date.getHours() >= 21) {
    if (date.getHours() === 21 && date.getMinutes() === 58) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
    if (date.getHours() !== 21) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
  }*/

  const isValidTime = isWithinTime(
    [
      {
        hour: "3:00",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "3:30",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "4:00",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "4:30",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "5:00",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "5:30",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "6:00",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "6:30",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "7:00",
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        hour: "7:30",
        weekdays: [1, 2, 3, 4, 5],
      },
    ],
    [],
    [],
    date
  );

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market");
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

  if (marketOrder) return;

  for (let i = currentDataIndex - ignoreLastNCandles; i > currentDataIndex - ignoreLastNCandles - candlesToCheck; i--) {
    if (!candles[i]) break;

    let isFalsePositive = false;
    for (let j = i + 1; j < currentDataIndex; j++) {
      if (candles[j].low <= candles[i].low) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    isFalsePositive = false;
    for (let j = i - candlesAmountWithLowerPriceToBeConsideredBottom; j < i; j++) {
      if (!candles[j]) continue;
      if (candles[j].low <= candles[i].low) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    for (
      let j = i - candlesAmountWithoutOtherBottoms - candlesAmountWithLowerPriceToBeConsideredBottom;
      j < i - candlesAmountWithLowerPriceToBeConsideredBottom;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].meta?.isBottom) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    const price = candles[i].low + 2 * priceAdjustment;
    if (price < candles[currentDataIndex].low - spreadAdjustment) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      let highestValue = candles[currentDataIndex].high;
      for (let i = currentDataIndex; i > currentDataIndex - 120; i--) {
        if (!candles[i]) break;
        if (candles[i].high > highestValue) {
          highestValue = candles[i].high;
        }
      }
      const diff = highestValue - candles[currentDataIndex].high;
      if (diff < 29 * priceAdjustment) {
        //return;
      }
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id as string));
      const stopLoss = price - stopLossDistance;
      const takeProfit = price + takeProfitDistance; // const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance + 1) || 1;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance / 10000) * 10000;

      const o = {
        type: "buy-limit" as OrderType,
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
      candles[i].meta = { isTop: true };
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
