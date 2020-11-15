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
  const candlesToCheck = 1000;
  const ignoreLastNCandles = 15;
  const riskPercentage = 1.5;
  const stopLossDistance = 12 * priceAdjustment;
  const takeProfitDistance = 27 * priceAdjustment;
  const tpDistanceShortForBreakEvenSL = 5 * priceAdjustment;

  if (candles.length === 0 || currentDataIndex === 0) return;
  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() > 21) {
    orders.map((mo) => closeOrder(mo.id!));
    persistedVars.pendingOrder = null;
  }

  function resistance() {
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
          if (order.position === "short") {
            order.type = "sell-limit";
          }
          createOrder(order);
        }
        persistedVars.pendingOrder = null;
        return;
      }
      persistedVars.pendingOrder = null;
    }

    const candlesAmountWithLowerPriceToBeConsideredTop = 15;
    const candlesAmountWithoutOtherTops = 0;

    const marketOrder = orders.find((o) => o.type === "market");
    if (marketOrder && marketOrder.position === "long") {
      if (marketOrder.takeProfit! - candles[currentDataIndex].high < tpDistanceShortForBreakEvenSL) {
        marketOrder.stopLoss = marketOrder.price;
      }
    }

    if (marketOrder) return;

    for (
      let i = currentDataIndex - ignoreLastNCandles;
      i > currentDataIndex - ignoreLastNCandles - candlesToCheck;
      i--
    ) {
      if (!candles[i]) break;

      let isFalsePositive = false;
      for (let j = i + 1; j < currentDataIndex; j++) {
        if (candles[j].high >= candles[i].high) {
          isFalsePositive = true;
          break;
        }
      }

      if (isFalsePositive) break;

      isFalsePositive = false;
      for (let j = i - candlesAmountWithLowerPriceToBeConsideredTop; j < i; j++) {
        if (!candles[j]) continue;
        if (candles[j].high >= candles[i].high) {
          isFalsePositive = true;
          break;
        }
      }

      if (isFalsePositive) break;

      for (
        let j = i - candlesAmountWithoutOtherTops - candlesAmountWithLowerPriceToBeConsideredTop;
        j < i - candlesAmountWithLowerPriceToBeConsideredTop;
        j++
      ) {
        if (!candles[j]) continue;
        if (candles[j].meta?.isTop) {
          isFalsePositive = true;
          break;
        }
      }

      if (isFalsePositive) break;

      const price = candles[i].high - 2 * priceAdjustment;
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
        candles[i].meta = { isTop: true };
      }
    }
  }

  function support() {
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
          if (order.position === "long") {
            order.type = "buy-limit";
          }
          createOrder(order);
        }
        persistedVars.pendingOrder = null;
        return;
      }
      persistedVars.pendingOrder = null;
    }

    const candlesAmountWithLowerPriceToBeConsideredBottom = 15;
    const candlesAmountWithoutOtherBottoms = 0;

    const marketOrder = orders.find((o) => o.type === "market");
    if (marketOrder && marketOrder.position === "short") {
      if (candles[currentDataIndex].low - marketOrder.takeProfit! < tpDistanceShortForBreakEvenSL) {
        marketOrder.stopLoss = marketOrder.price;
      }
    }

    if (marketOrder) return;

    for (
      let i = currentDataIndex - ignoreLastNCandles;
      i > currentDataIndex - ignoreLastNCandles - candlesToCheck;
      i--
    ) {
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
        candles[i].meta = { isBottom: true };
      }
    }
  }

  resistance();
  support();

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
