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
  
      const takeProfitDistance = 100 * priceAdjustment;
      const stopLossDistance = 100 * priceAdjustment;
  
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
        limitPriceOffset: 0,
        rangePoints: 3,
        startWith: "resistance",
        takeProfitStrategy: "half"
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
        ranges
      };
    }

    strategies.find(s => s.name === "Ranges Longs")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params: getParams(params || null), strategies
    });
  }

  function shorts() {
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
  
      const takeProfitDistance = 100 * priceAdjustment;
      const stopLossDistance = 70 * priceAdjustment;
  
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      const ranges: StrategyParams["ranges"] = {
        candlesToCheck: 300,
        maxPriceDifferenceForSameHorizontalLevel: 25 * priceAdjustment,
        minPriceDifferenceBetweenRangePoints: 20 * priceAdjustment,
        minCandlesBetweenRangePoints: 4,
        maxCandlesBetweenRangePoints: 300,
        limitPriceOffset: 0 * priceAdjustment,
        rangePoints: 4,
        startWith: "resistance",
        takeProfitStrategy: "half"
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
        ranges
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
