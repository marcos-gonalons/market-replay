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
      const priceOffset = 75 * priceAdjustment;
      const maxAttemptsToGetSL = 10;
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 30,
        past: 40
      }
  
      const minStopLossDistance = 50 * priceAdjustment;
      const maxStopLossDistance = 600 * priceAdjustment;
      const takeProfitDistance = 200 * priceAdjustment;
      const minProfit = 99999 * priceAdjustment;
  
      const trailingSL = {
        tpDistanceShortForTighterSL: 30 * priceAdjustment,
        slDistanceWhenTpIsVeryClose: 90 * priceAdjustment
      }
  
      const trailingTP = {
        slDistanceShortForTighterTP: 100 * priceAdjustment,
        tpDistanceWhenSlIsVeryClose: -20 * priceAdjustment
      }
  
      const candlesAmountWithoutEMAsCrossing = 12;
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];
  
      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        minStopLossDistance,
        maxStopLossDistance,
        candlesAmountToBeConsideredHorizontalLevel,
        priceOffset,
        takeProfitDistance,
        minProfit,
        trailingSL,
        trailingTP,
        candlesAmountWithoutEMAsCrossing,
        maxSecondsOpenTrade,
        maxAttemptsToGetSL
      };
    }

    strategies.find(s => s.name === "EMA Crossover Longs")!.func({
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
      const priceOffset = 25 * priceAdjustment;
      const maxAttemptsToGetSL = 10;
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 25,
        past: 10
      }
  
      const minStopLossDistance = 60 * priceAdjustment;
      const maxStopLossDistance = 500 * priceAdjustment;
      const takeProfitDistance = 120 * priceAdjustment;
      const minProfit = 60 * priceAdjustment;
  
      const trailingSL = {
        tpDistanceShortForTighterSL: 0 * priceAdjustment,
        slDistanceWhenTpIsVeryClose: 0 * priceAdjustment
      }
  
      const trailingTP = {
        slDistanceShortForTighterTP: 20 * priceAdjustment,
        tpDistanceWhenSlIsVeryClose: -100 * priceAdjustment
      }
  
      const candlesAmountWithoutEMAsCrossing = 10;
      const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
  
      const validHours: StrategyParams["validHours"] = [];
      const validMonths: StrategyParams["validMonths"] = [];
      const validDays: StrategyParams["validDays"] = [];
  
      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        minStopLossDistance,
        maxStopLossDistance,
        candlesAmountToBeConsideredHorizontalLevel,
        priceOffset,
        takeProfitDistance,
        minProfit,
        trailingSL,
        trailingTP,
        candlesAmountWithoutEMAsCrossing,
        maxSecondsOpenTrade,
        maxAttemptsToGetSL
      };
    }

    strategies.find(s => s.name === "EMA Crossover Shorts")!.func({
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
