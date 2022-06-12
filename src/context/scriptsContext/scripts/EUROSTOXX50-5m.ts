import { StrategyFuncParameters, StrategyParams } from "../../../services/scriptsExecutioner/Types";
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
}: StrategyFuncParameters) {
  const ENABLE_DEBUG = false;

  void balance;
  void params;

  if (balance < 0) {
      balance = 1;
  }

  if (candles.length === 0 || currentDataIndex === 0) return;
  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 7 || date.getHours() >= 21) {
    if (date.getHours() === 21 && date.getMinutes() === 55) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
  }

  function resistance() {
    const priceAdjustment = 1;

    function getParams(params: StrategyParams | null): StrategyParams {
      if (params) {
        return params;
      }

      const riskPercentage = 1;
      const stopLossDistance = 23 * priceAdjustment;
      const takeProfitDistance = 27 * priceAdjustment;
      const tpDistanceShortForTighterSL = 0 * priceAdjustment;
      const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
      const trendCandles = 0;
      const trendDiff = 0 * priceAdjustment;
      const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 85;
      const priceOffset = 3 * priceAdjustment;
      const maxSecondsOpenTrade = 0;

      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        stopLossDistance,
        takeProfitDistance,
        tpDistanceShortForTighterSL,
        slDistanceWhenTpIsVeryClose,
        trendCandles,
        trendDiff,
        candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
        priceOffset,
        maxSecondsOpenTrade,
      };
    }

    const scriptParams = getParams(params || null);

    if (!isWithinTime([], [], scriptParams.validMonths!, date) || !isWithinTime([], scriptParams.validDays!, [], date)) {
      return;
    }

    const isValidTime = isWithinTime(scriptParams.validHours!, scriptParams.validDays!, scriptParams.validMonths!, date);

    const marketOrder = orders.find((o) => o.type === "market");

    debugLog(ENABLE_DEBUG, "RESISTANCE", "Current pending order", persistedVars.pendingOrder);
    if (!isValidTime) {
      debugLog(ENABLE_DEBUG, "RESISTANCE", "Not valid time", date);
      const order = orders.find((o) => o.type !== "market" && o.position === "short");
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
        if (order.position === "short") {
          if (order.price > candles[currentDataIndex].close) {
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

    if (marketOrder && marketOrder.position === "short") {
      if (
        candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
        candles[currentDataIndex].low - marketOrder.takeProfit! < scriptParams.tpDistanceShortForTighterSL
      ) {
        debugLog(
          ENABLE_DEBUG,
          "RESISTANCE",
          "Adjusting SL ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          scriptParams.tpDistanceShortForTighterSL
        );
        marketOrder.stopLoss = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
      }
    }

    const horizontalLevelCandleIndex = currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
    ) {
      return;
    }

    let isFalsePositive = false;
    for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
      if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "RESISTANCE", "future_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    isFalsePositive = false;
    for (
      let j = horizontalLevelCandleIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
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

    const price = candles[horizontalLevelCandleIndex].high - scriptParams.priceOffset;
    if (price > candles[currentDataIndex].close + spread / 2) {
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
        }
    }

    const diff = highestValue - candles[currentDataIndex].high;
      if (diff < scriptParams.trendDiff) {
        debugLog(ENABLE_DEBUG, "RESISTANCE", "Diff is too big, won't create the order...", date, diff, scriptParams.trendDiff);
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price + scriptParams.stopLossDistance;
      const takeProfit = price - scriptParams.takeProfitDistance;
      const size = Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance + 1) || 1;

      const o = {
        type: "sell-limit" as OrderType,
        position: "short" as Position,
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
    const priceAdjustment = 1;

    function getParams(params: StrategyParams | null): StrategyParams {
      if (params) {
        return params;
      }

      const riskPercentage = 1;
      const stopLossDistance = 15 * priceAdjustment;
      const takeProfitDistance = 15 * priceAdjustment;
      const tpDistanceShortForTighterSL = 0 * priceAdjustment;
      const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
      const trendCandles = 0;
      const trendDiff = 0 * priceAdjustment;
      const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 27;
      const priceOffset = 0 * priceAdjustment;
      const maxSecondsOpenTrade = 0;

      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        stopLossDistance,
        takeProfitDistance,
        tpDistanceShortForTighterSL,
        slDistanceWhenTpIsVeryClose,
        trendCandles,
        trendDiff,
        candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
        priceOffset,
        maxSecondsOpenTrade,
      };
    }

    const scriptParams = getParams(params || null);

    if (!isWithinTime([], [], scriptParams.validMonths!, date) || !isWithinTime([], scriptParams.validDays!, [], date)) {
      return;
    }
    const isValidTime = isWithinTime(scriptParams.validHours!, scriptParams.validDays!, scriptParams.validMonths!, date);
    const marketOrder = orders.find((o) => o.type === "market");

    debugLog(ENABLE_DEBUG, "SUPPORT", "Current pending order", persistedVars.pendingOrder);
    if (!isValidTime) {
      debugLog(ENABLE_DEBUG, "SUPPORT", "Not valid time", date);
      const order = orders.find((o) => o.type !== "market" && o.position === "long");
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
        if (order.position === "long") {
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
      if (
        candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
        marketOrder.takeProfit! - candles[currentDataIndex].high < scriptParams.tpDistanceShortForTighterSL
      ) {
        debugLog(
          ENABLE_DEBUG,
          "SUPPORT",
          "Adjusting SL ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          scriptParams.tpDistanceShortForTighterSL
        );
        marketOrder.stopLoss = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
      }
    }

    const horizontalLevelCandleIndex = currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
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
      let j = horizontalLevelCandleIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
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

    const price = candles[horizontalLevelCandleIndex].low + scriptParams.priceOffset;
    if (price < candles[currentDataIndex].close - spread / 2) {
      let lowestValue = candles[currentDataIndex].low;

      for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].low < lowestValue) {
          lowestValue = candles[i].low;
        }
      }

      const diff = candles[currentDataIndex].low - lowestValue;
      if (diff < scriptParams.trendDiff) {
        debugLog(ENABLE_DEBUG, "SUPPORT", "Diff is too big, won't create the order...", date, diff, scriptParams.trendDiff);
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price - scriptParams.stopLossDistance;
      const takeProfit = price + scriptParams.takeProfitDistance;
      const size = Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance + 1) || 1;

      const o = {
        type: "buy-limit" as OrderType,
        position: "long" as Position,
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

  void support;
  // support();

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
