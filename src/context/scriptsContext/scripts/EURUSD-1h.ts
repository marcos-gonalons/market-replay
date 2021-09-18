import { ScriptFuncParameters, ScriptParams } from "../../../services/scriptsExecutioner/Types";
import { OrderType, Position } from "../../tradesContext/Types";

export default (function f({
  candles,
  orders,
  trades,
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

  void persistedVars;
  void isWithinTime;
  void balance;
  void trades;

  function resistanceBounce() {
    const priceAdjustment = 1 / 10000;

    function getParams(params: ScriptParams | null): ScriptParams {
      if (params) {
        return params;
      }

      const riskPercentage = 5;
      const stopLossDistance = 290 * priceAdjustment;
      const takeProfitDistance = 460 * priceAdjustment;
      const tpDistanceShortForTighterSL = 150 * priceAdjustment;
      const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
      const trendCandles = 120;
      const trendDiff = 200 * priceAdjustment;
      const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 27;
      const priceOffset = -10 * priceAdjustment;
      const maxSecondsOpenTrade = 35 * 24 * 60 * 60; // 35 days

      const validHours: ScriptParams["validHours"] = [];
      const validMonths: ScriptParams["validMonths"] = [];
      const validDays: ScriptParams["validDays"] = [];

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

    if (candles.length <= 1 || currentDataIndex === 0) return;

    const date = new Date(candles[currentDataIndex].timestamp);
    const marketOrder = orders.find((o) => o.type === "market" && o.position === "short");

    if (marketOrder && scriptParams.maxSecondsOpenTrade) {
      const diffInSeconds = Math.floor((date.valueOf() - marketOrder.createdAt!.valueOf()) / 1000);

      if (diffInSeconds >= scriptParams.maxSecondsOpenTrade) {
        debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, marketOrder);
        closeOrder(marketOrder.id!);
      }
    }

    if (marketOrder) {
      const newSLPrice = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
      if (
        candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
        candles[currentDataIndex].low - marketOrder.takeProfit! < scriptParams.tpDistanceShortForTighterSL &&
        candles[currentDataIndex].close < newSLPrice
      ) {
        debugLog(
          ENABLE_DEBUG,
          "Adjusting SL ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          scriptParams.tpDistanceShortForTighterSL
        );
        marketOrder.stopLoss = newSLPrice;
      }
    }

    const horizontalLevelCandleIndex =
      currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
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
        debugLog(ENABLE_DEBUG, "future_overcame", date);
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
        debugLog(ENABLE_DEBUG, "past_overcame", date);
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
        debugLog(ENABLE_DEBUG, "Diff is too small, won't create the order...", date, diff, scriptParams.trendDiff);
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price + scriptParams.stopLossDistance;
      const takeProfit = price - scriptParams.takeProfitDistance;

      const size =
        Math.floor((balance * (scriptParams.riskPercentage / 100)) / (scriptParams.stopLossDistance * 10000 * 0.85)) *
          10000 || 10000;

      const rollover = (0.7 * size) / 10000;
      const o = {
        type: "sell-limit" as OrderType,
        position: "short" as Position,
        size,
        price,
        stopLoss,
        takeProfit,
        rollover,
      };
      debugLog(ENABLE_DEBUG, "Order to be created", date, o);

      if (orders.find((o) => o.type === "market")) {
        debugLog(ENABLE_DEBUG, "There is an open position, not creating the order ...", date, marketOrder);
        return;
      }

      debugLog(ENABLE_DEBUG, "Time is right, creating the order", date);
      createOrder(o);
    } else {
      debugLog(
        ENABLE_DEBUG,
        "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
        date
      );
      debugLog(ENABLE_DEBUG, "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
    }
  }

  function supportBounce() {
    const priceAdjustment = 1 / 10000;

    function getParams(params: ScriptParams | null): ScriptParams {
      if (params) {
        return params;
      }

      const riskPercentage = 5;
      const stopLossDistance = 180 * priceAdjustment;
      const takeProfitDistance = 370 * priceAdjustment;
      const tpDistanceShortForTighterSL = 200 * priceAdjustment;
      const slDistanceWhenTpIsVeryClose = 40 * priceAdjustment;
      const trendCandles = 200;
      const trendDiff = 220 * priceAdjustment;
      const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 27;
      const priceOffset = 18 * priceAdjustment;
      const maxSecondsOpenTrade = 20 * 24 * 60 * 60; // 20 days

      const validHours: ScriptParams["validHours"] = [];
      const validMonths: ScriptParams["validMonths"] = [];
      const validDays: ScriptParams["validDays"] = [];

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

    if (candles.length <= 1 || currentDataIndex === 0) return;

    const date = new Date(candles[currentDataIndex].timestamp);
    const marketOrder = orders.find((o) => o.type === "market" && o.position === "long");

    if (marketOrder && scriptParams.maxSecondsOpenTrade) {
      const diffInSeconds = Math.floor((date.valueOf() - marketOrder.createdAt!.valueOf()) / 1000);

      if (diffInSeconds >= scriptParams.maxSecondsOpenTrade) {
        debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, marketOrder);
        closeOrder(marketOrder.id!);
      }
    }

    if (marketOrder) {
      const newSLPrice = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
      if (
        candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
        marketOrder.takeProfit! - candles[currentDataIndex].high < scriptParams.tpDistanceShortForTighterSL &&
        candles[currentDataIndex].close > newSLPrice
      ) {
        debugLog(
          ENABLE_DEBUG,
          "Adjusting SL ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          scriptParams.tpDistanceShortForTighterSL
        );
        marketOrder.stopLoss = newSLPrice;
      }
    }

    const horizontalLevelCandleIndex =
      currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
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
        debugLog(ENABLE_DEBUG, "future_overcame", date);
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
        debugLog(ENABLE_DEBUG, "past_overcame", date);
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
        debugLog(ENABLE_DEBUG, "Diff is too big, won't create the order...", date, diff, scriptParams.trendDiff);
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price - scriptParams.stopLossDistance;
      const takeProfit = price + scriptParams.takeProfitDistance;

      const size =
        Math.floor((balance * (scriptParams.riskPercentage / 100)) / (scriptParams.stopLossDistance * 10000 * 0.85)) *
          10000 || 10000;

      const rollover = (0.7 * size) / 10000;
      const o = {
        type: "buy-limit" as OrderType,
        position: "long" as Position,
        size,
        price,
        stopLoss,
        takeProfit,
        rollover,
      };
      debugLog(ENABLE_DEBUG, "Order to be created", date, o);

      if (orders.find((o) => o.type === "market")) {
        debugLog(ENABLE_DEBUG, "There is an open position, not creating the order ...", date, marketOrder);
        return;
      }

      debugLog(ENABLE_DEBUG, "Time is right, creating the order", date);
      createOrder(o);
    } else {
      debugLog(
        ENABLE_DEBUG,
        "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
        date
      );
      debugLog(ENABLE_DEBUG, "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
    }
  }

  resistanceBounce();
  supportBounce();

  // end script
}
  .toString()
  .replace(
    `
function f({
  candles,
  orders,
  trades,
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
    `// end script
}`.trim(),
    ``
  ));
