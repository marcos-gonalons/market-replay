import { ScriptFuncParameters, ScriptParams } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";

export default (function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
  debugLog,
}: ScriptFuncParameters) {
  const ENABLE_DEBUG = false;

  if (balance < 0) return;
  void params;

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

  function resistance() {
    const priceAdjustment = 1; // 1/100000;
    const riskPercentage = 1.5;
    const stopLossDistance = 24 * priceAdjustment;
    const takeProfitDistance = 34 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 0 * priceAdjustment;
    const trendCandles = 60;
    const trendDiff = 15;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 24;
    const priceOffset = 1 * priceAdjustment;
    const validHours: ScriptParams["validHours"] = [
      { hour: "9:00", weekdays: [] },
      { hour: "9:30", weekdays: [] },
      { hour: "10:00", weekdays: [] },
      { hour: "10:30", weekdays: [] },
      { hour: "11:00", weekdays: [] },
      { hour: "11:30", weekdays: [] },
      { hour: "12:00", weekdays: [] },
      { hour: "12:30", weekdays: [] },
      { hour: "13:00", weekdays: [] },
      { hour: "13:30", weekdays: [] },
      { hour: "14:00", weekdays: [] },
      { hour: "16:00", weekdays: [] },
      { hour: "16:30", weekdays: [] },
      { hour: "17:00", weekdays: [] },
      { hour: "17:30", weekdays: [] },
      { hour: "20:00", weekdays: [] },
      { hour: "20:30", weekdays: [] },
    ];
    const validMonths: ScriptParams["validMonths"] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const validDays: ScriptParams["validDays"] = [];

    if (!isWithinTime([], [], validMonths, date) || !isWithinTime([], validDays, [], date)) {
      return;
    }

    const isValidTime = isWithinTime(validHours!, validDays!, validMonths!, date);

    const marketOrder = orders.find((o) => o.type === "market");

    debugLog(ENABLE_DEBUG, "RESISTANCE", "Current pending order", persistedVars.pendingOrder);
    if (!isValidTime) {
      debugLog(ENABLE_DEBUG, "RESISTANCE", "Not valid time", date);
      const order = orders.find((o) => o.type !== "market" && o.position === "long");
      if (order) {
        debugLog(ENABLE_DEBUG, "RESISTANCE", "There is an active order, saving pending order...", date, order);
        persistedVars.pendingOrder = { ...order };
        closeOrder(order.id!);
        return;
      } else {
        debugLog(ENABLE_DEBUG, "RESISTANCE", "There isn't any active order", date);
      }
    } else {
      debugLog(ENABLE_DEBUG, "RESISTANCE", "Time is right", date);
      if (persistedVars.pendingOrder) {
        const order = persistedVars.pendingOrder as Order;
        debugLog(ENABLE_DEBUG, "RESISTANCE", "There is a pending order", date, order);
        if (order.position === "long") {
          if (order.price > candles[currentDataIndex].high) {
            debugLog(ENABLE_DEBUG, "RESISTANCE", "Creating pending order", date, order);
            if (!marketOrder) {
              createOrder(order);
            } else {
              debugLog(
                ENABLE_DEBUG,
                "RESISTANCE",
                "Can't create the pending order because there is an open position",
                marketOrder
              );
            }
          } else {
            debugLog(
              ENABLE_DEBUG,
              "RESISTANCE",
              "Can't create the pending order since the price is smaller than the candle.high",
              order.price,
              candles[currentDataIndex],
              date
            );
          }
          persistedVars.pendingOrder = null;
          return;
        } else {
          debugLog(ENABLE_DEBUG, "RESISTANCE", "Pending order is SHORT, will not be created", date);
        }
      } else {
        debugLog(ENABLE_DEBUG, "RESISTANCE", "There is not any pending order", date);
      }
      persistedVars.pendingOrder = null;
      debugLog(ENABLE_DEBUG, "RESISTANCE", "Set pending order to null", date);
    }

    if (marketOrder && marketOrder.position === "long") {
      if (marketOrder.takeProfit! - candles[currentDataIndex].high < tpDistanceShortForBreakEvenSL) {
        debugLog(
          ENABLE_DEBUG,
          "RESISTANCE",
          "Adjusting SL to break even ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          tpDistanceShortForBreakEvenSL
        );
        marketOrder.stopLoss = marketOrder.price;
      }
    }

    const horizontalLevelCandleIndex = currentDataIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
    ) {
      return;
    }

    let isFalsePositive = false;
    for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex - 1; j++) {
      if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "RESISTANCE", "future_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    isFalsePositive = false;
    for (
      let j = horizontalLevelCandleIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
      j < horizontalLevelCandleIndex;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "RESISTANCE", "past_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    const price = candles[horizontalLevelCandleIndex].high - priceOffset;
    if (price > candles[currentDataIndex].close + spread / 2) {
      // orders.filter((o) => o.type !== "market" && o.position === "long").map((nmo) => closeOrder(nmo.id!));
      let lowestValue = candles[currentDataIndex].low;

      for (let i = currentDataIndex; i > currentDataIndex - trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].low < lowestValue) {
          lowestValue = candles[i].low;
        }
      }

      const diff = candles[currentDataIndex].low - lowestValue;
      if (diff < trendDiff) {
        debugLog(ENABLE_DEBUG, "RESISTANCE", "Diff is too big, won't create the order...", date, diff, trendDiff);
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
      debugLog(ENABLE_DEBUG, "RESISTANCE", "Order to be created", date, o);

      if (marketOrder) {
        debugLog(ENABLE_DEBUG, "There is an open position, saving the order for later...", date, marketOrder);
        persistedVars.pendingOrder = o;
        return;
      }

      if (!isValidTime) {
        debugLog(ENABLE_DEBUG, "RESISTANCE", "Not the right time, saving the order for later...", date);
        persistedVars.pendingOrder = o;
        return;
      }

      debugLog(ENABLE_DEBUG, "RESISTANCE", "Time is right, creating the order", date);
      createOrder(o);
    } else {
      debugLog(
        ENABLE_DEBUG,
        "RESISTANCE",
        "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
        date
      );
      debugLog(ENABLE_DEBUG, "RESISTANCE", "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
    }
  }

  function support() {
    const priceAdjustment = 1; // 1/100000;
    const riskPercentage = 1.5;
    const stopLossDistance = 15 * priceAdjustment;
    const takeProfitDistance = 34 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 1 * priceAdjustment;
    const trendCandles = 90;
    const trendDiff = 30;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 14;
    const priceOffset = 2 * priceAdjustment;
    const validHours: ScriptParams["validHours"] = [
      { hour: "8:00", weekdays: [1, 2, 4, 5] },
      { hour: "8:30", weekdays: [1, 2, 4, 5] },
      { hour: "9:00", weekdays: [1, 2, 4, 5] },
      { hour: "10:00", weekdays: [1, 2, 4, 5] },
      { hour: "10:30", weekdays: [1, 2, 4, 5] },
      { hour: "11:00", weekdays: [1, 2, 4, 5] },
      { hour: "11:30", weekdays: [1, 2, 4, 5] },
      { hour: "12:00", weekdays: [1, 2, 4, 5] },
      { hour: "12:30", weekdays: [1, 2, 4, 5] },
      { hour: "13:00", weekdays: [1, 2, 4, 5] },
      { hour: "14:00", weekdays: [1, 2, 4, 5] },
      { hour: "14:30", weekdays: [1, 2, 4, 5] },
      { hour: "15:00", weekdays: [1, 2, 4, 5] },
      { hour: "15:30", weekdays: [1, 2, 4, 5] },
      { hour: "16:00", weekdays: [1, 2, 4, 5] },
      { hour: "16:30", weekdays: [1, 2, 4, 5] },
      { hour: "17:00", weekdays: [1, 2, 4, 5] },
      { hour: "18:00", weekdays: [1, 2, 4, 5] },
    ];
    const validMonths: ScriptParams["validMonths"] = [0, 2, 3, 4, 5, 7, 8, 9, 11];
    const validDays: ScriptParams["validDays"] = [
      { weekday: 1, hours: [] },
      { weekday: 2, hours: [] },
      { weekday: 4, hours: [] },
      { weekday: 5, hours: [] },
    ];

    if (!isWithinTime([], [], validMonths, date) || !isWithinTime([], validDays, [], date)) {
      return;
    }
    const isValidTime = isWithinTime(validHours!, validDays!, validMonths!, date);
    const marketOrder = orders.find((o) => o.type === "market");

    debugLog(ENABLE_DEBUG, "SUPPORT", "Current pending order", persistedVars.pendingOrder);
    if (!isValidTime) {
      debugLog(ENABLE_DEBUG, "SUPPORT", "Not valid time", date);
      const order = orders.find((o) => o.type !== "market" && o.position === "short");
      if (order) {
        debugLog(ENABLE_DEBUG, "SUPPORT", "There is an active order, saving pending order...", date, order);
        persistedVars.pendingOrder = { ...order };
        closeOrder(order.id!);
        return;
      } else {
        debugLog(ENABLE_DEBUG, "SUPPORT", "There isn't any active order", date);
      }
    } else {
      debugLog(ENABLE_DEBUG, "SUPPORT", "Time is right", date);
      if (persistedVars.pendingOrder) {
        const order = persistedVars.pendingOrder as Order;
        debugLog(ENABLE_DEBUG, "SUPPORT", "There is a pending order", date, order);
        if (order.position === "short") {
          if (order.price < candles[currentDataIndex].low) {
            debugLog(ENABLE_DEBUG, "SUPPORT", "Creating pending order", date, order);
            if (!marketOrder) {
              createOrder(order);
            } else {
              debugLog(
                ENABLE_DEBUG,
                "SUPPORT",
                "Can't create the pending order because there is an open position",
                marketOrder
              );
            }
          } else {
            debugLog(
              ENABLE_DEBUG,
              "SUPPORT",
              "Can't create the pending order since the price is bigger than the candle.low",
              order.price,
              candles[currentDataIndex],
              date
            );
          }
          persistedVars.pendingOrder = null;
          return;
        } else {
          debugLog(ENABLE_DEBUG, "SUPPORT", "Pending order is LONG, will not be created", date);
        }
      } else {
        debugLog(ENABLE_DEBUG, "SUPPORT", "There is not any pending order", date);
      }
      persistedVars.pendingOrder = null;
      debugLog(ENABLE_DEBUG, "SUPPORT", "Set pending order to null", date);
    }

    if (marketOrder && marketOrder.position === "long") {
      if (marketOrder.takeProfit! - candles[currentDataIndex].high < tpDistanceShortForBreakEvenSL) {
        debugLog(
          ENABLE_DEBUG,
          "SUPPORT",
          "Adjusting SL to break even ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          tpDistanceShortForBreakEvenSL
        );
        marketOrder.stopLoss = marketOrder.price;
      }
    }

    const horizontalLevelCandleIndex = currentDataIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
    ) {
      return;
    }

    let isFalsePositive = false;
    for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
      if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "SUPPORT", "future_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    isFalsePositive = false;
    for (
      let j = horizontalLevelCandleIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
      j < horizontalLevelCandleIndex;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "SUPPORT", "past_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    const price = candles[horizontalLevelCandleIndex].low + priceOffset;
    if (price < candles[currentDataIndex].close - spread / 2) {
      orders.filter((o) => o.type !== "market" && o.position === "short").map((nmo) => closeOrder(nmo.id!));
      let highestValue = candles[currentDataIndex].high;

      for (let i = currentDataIndex; i > currentDataIndex - trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].high > highestValue) {
          highestValue = candles[i].high;
        }
      }

      const diff = highestValue - candles[currentDataIndex].high;
      if (diff < trendDiff) {
        debugLog(ENABLE_DEBUG, "SUPPORT", "Diff is too big, won't create the order...", date, diff, trendDiff);
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
      debugLog(ENABLE_DEBUG, "SUPPORT", "Order to be created", date, o);

      if (marketOrder) {
        debugLog(ENABLE_DEBUG, "There is an open position, saving the order for later...", date, marketOrder);
        persistedVars.pendingOrder = o;
        return;
      }

      if (!isValidTime) {
        debugLog(ENABLE_DEBUG, "SUPPORT", "Not the right time, saving the order for later...", date);
        persistedVars.pendingOrder = o;
        return;
      }

      debugLog(ENABLE_DEBUG, "SUPPORT", "Time is right, creating the order", date);
      createOrder(o);
    } else {
      debugLog(
        ENABLE_DEBUG,
        "SUPPORT",
        "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
        date
      );
      debugLog(ENABLE_DEBUG, "SUPPORT", "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
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
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
  debugLog
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script
}`.trim(),
    ``
  ));
