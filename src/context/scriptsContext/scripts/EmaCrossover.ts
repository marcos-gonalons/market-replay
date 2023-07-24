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
      const stopLossPriceOffset = 75 * priceAdjustment;
      const maxAttemptsToGetSL = 12;
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 30,
        past: 45
      }
  
      const minStopLossDistance = 10 * priceAdjustment;
      const maxStopLossDistance = 600 * priceAdjustment;
      const takeProfitDistance = 230 * priceAdjustment;
      const minProfit = 9999 * priceAdjustment;
  
      const trailingSL = {
        tpDistanceShortForTighterSL: 30 * priceAdjustment,
        slDistanceWhenTpIsVeryClose: -90 * priceAdjustment
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
        takeProfitDistance,
        minProfit,
        trailingSL,
        trailingTP,
        maxSecondsOpenTrade,
        emaCrossover: {
          stopLossPriceOffset,
          maxAttemptsToGetSL,
          candlesAmountWithoutEMAsCrossing
        }
      };
    }

    strategies.find(s => s.name === "EMA Crossover Longs")!.func({
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
      const stopLossPriceOffset = 25 * priceAdjustment;
      const maxAttemptsToGetSL = 11;
  
      const candlesAmountToBeConsideredHorizontalLevel = {
        future: 30,
        past: 45
      }
  
      const minStopLossDistance = 0 * priceAdjustment;
      const maxStopLossDistance = 200 * priceAdjustment;
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
        takeProfitDistance,
        minProfit,
        trailingSL,
        trailingTP,
        maxSecondsOpenTrade,
        emaCrossover: {
          stopLossPriceOffset,
          maxAttemptsToGetSL,
          candlesAmountWithoutEMAsCrossing
        }
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
