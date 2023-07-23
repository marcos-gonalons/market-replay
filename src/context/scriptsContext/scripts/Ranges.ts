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
      const priceAdjustment = 1 / 10000;
  
      const riskPercentage = 1;
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 10,
        past: 10
      }
  
      const takeProfitDistance = 100 * priceAdjustment;
      const stopLossDistance = 50 * priceAdjustment;
      const maxStopLossDistance = 340 * priceAdjustment;
  
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      const ranges: StrategyParams["ranges"] = {
        candlesToCheck: 300,
        maxPriceDifferenceForSameHorizontalLevel: 70 * priceAdjustment,
        minPriceDifferenceBetweenRangePoints: 100 * priceAdjustment,
        minCandlesBetweenRangePoints: 10,
        maxCandlesBetweenRangePoints: 100,
        priceOffset: 0,
        rangePoints: 3,
        startWith: "resistance",
        takeProfitStrategy: "distance",
        stopLossStrategy: "levelWithOffset",
        orderType: "buy-stop",
        trendyOnly: false,
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
        future: 2,
        past: 2
      }
  
      const takeProfitDistance = 200 * priceAdjustment;
      const stopLossDistance = 50 * priceAdjustment;
      const maxStopLossDistance = 350 * priceAdjustment;
  
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      const ranges: StrategyParams["ranges"] = {
        candlesToCheck: 1000,
        maxPriceDifferenceForSameHorizontalLevel: 25 * priceAdjustment,
        minPriceDifferenceBetweenRangePoints: 20 * priceAdjustment,
        minCandlesBetweenRangePoints: 4,
        maxCandlesBetweenRangePoints: 100,
        priceOffset: 0 * priceAdjustment,
        rangePoints: 3,
        startWith: "support",
        takeProfitStrategy: "distance",
        stopLossStrategy: "half",
        orderType: "sell-stop",
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
