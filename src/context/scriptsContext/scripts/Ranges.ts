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
        future: 5,
        past: 5
      }
  
      const takeProfitDistance = 50 * priceAdjustment;
      const stopLossDistance = 50 * priceAdjustment;
  
      const trailingSL = {
        tpDistanceShortForTighterSL: 0 * priceAdjustment,
        slDistanceWhenTpIsVeryClose: 0 * priceAdjustment
      }
  
      const trailingTP = {
        slDistanceShortForTighterTP: 0 * priceAdjustment,
        tpDistanceWhenSlIsVeryClose: 0 * priceAdjustment
      }
  
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];

      const ranges: StrategyParams["ranges"] = {
        candlesToCheck: 300,
        maxPriceDifferenceForSameHorizontalLevel: 500 * priceAdjustment,
        minPriceDifferenceBetweenRangePoints: 10 * priceAdjustment,
        minCandlesBetweenRangePoints: 2,
        maxCandlesBetweenRangePoints: 500
      }
  
      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        stopLossDistance,
        candlesAmountToBeConsideredHorizontalLevel,
        takeProfitDistance,
        trailingSL,
        trailingTP,
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

  longs();

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
