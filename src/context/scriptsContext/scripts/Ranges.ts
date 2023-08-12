import { StrategyFuncParameters, StrategyParams } from "../../../services/scriptsExecutioner/Types";

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
  debugLog,
  params,
  strategies
}: StrategyFuncParameters) {
  if (balance < 0) {
    balance = 1;
  }

  if (candles.length === 0 || currentDataIndex === 0) return;

  function longs() {
    function getParams(params: StrategyParams | null): StrategyParams {
      if (params) {
        return params;
      }
      const riskPercentage = 1;
      const priceAdjustment = 1;//1 / 10000;
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 10,
        past: 20
      }

      const takeProfitDistance = 60 * priceAdjustment;
      const stopLossDistance = -10 * priceAdjustment;
      const maxStopLossDistance = 300 * priceAdjustment;
  
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
      const ranges: StrategyParams["ranges"] = {
        candlesToCheck: 400,
        maxPriceDifferenceForSameHorizontalLevel: 25 * priceAdjustment,
        minPriceDifferenceBetweenRangePoints: 120 * priceAdjustment,
        minCandlesBetweenRangePoints: 5,
        maxCandlesBetweenRangePoints: 300,
        minimumDistanceToLevel: 30 * priceAdjustment,
        priceOffset: 0 * priceAdjustment,
        rangePoints: 3,
        startWith: "resistance",
        takeProfitStrategy: "levelWithOffset",
        stopLossStrategy: "levelWithOffset",
        orderType: "market",
        trendyOnly: true,
      }

      const trailingSL = {
        tpDistanceShortForTighterSL: 70 * priceAdjustment,
        slDistanceWhenTpIsVeryClose: -40 * priceAdjustment
      }
  
      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        stopLossDistance,
        candlesAmountToBeConsideredHorizontalLevel,
        takeProfitDistance,
        maxSecondsOpenTrade,
        ranges,
        maxStopLossDistance,
        trailingSL
      };
    }

    strategies.find(s => s.name === "Ranges Longs")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params: getParams(params || null), strategies
    });
  }

  function shorts() {
    return;
    function getParams(params: StrategyParams | null): StrategyParams {
      if (params) {
        return params;
      }
      const priceAdjustment = 1 / 10000;
  
      const riskPercentage = 1;
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 10,
        past: 10
      }
  
      const takeProfitDistance = 60 * priceAdjustment;
      const stopLossDistance = -20 * priceAdjustment;
      const maxStopLossDistance = 300* priceAdjustment;
  
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      const ranges: StrategyParams["ranges"] = {
        candlesToCheck: 1000,
        maxPriceDifferenceForSameHorizontalLevel: 25 * priceAdjustment,
        minPriceDifferenceBetweenRangePoints: 120 * priceAdjustment,
        minCandlesBetweenRangePoints: 10,
        maxCandlesBetweenRangePoints: 100,
        minimumDistanceToLevel: 30 * priceAdjustment,
        priceOffset: 0 * priceAdjustment,
        rangePoints: 3,
        startWith: "support",
        takeProfitStrategy: "levelWithOffset",
        stopLossStrategy: "levelWithOffset",
        orderType: "market",
        trendyOnly: false
      }
  
      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        stopLossDistance,
        candlesAmountToBeConsideredHorizontalLevel,
        takeProfitDistance,
        maxSecondsOpenTrade,
        ranges,
        maxStopLossDistance
      };
    }

    strategies.find(s => s.name === "Ranges Shorts")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params: getParams(params || null), strategies
    });
  }

  longs();
  shorts();

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
  debugLog,
  params,
  strategies
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script
}`.trim(),
    ``
  ));
