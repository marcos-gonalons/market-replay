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
  strategies
}: StrategyFuncParameters) {
  if (balance < 0) {
    balance = 1;
  }

  if (candles.length === 0 || currentDataIndex === 0) return;


  function longs() {
    const priceAdjustment = 1 / 10000;

    const riskPercentage = 1;
    const priceOffset = 75 * priceAdjustment;

    const candlesAmountToBeConsideredHorizontalLevel = {
      future: 30,
      past: 40
    }

    const minStopLossDistance = 50 * priceAdjustment;
    const maxStopLossDistance = 600 * priceAdjustment;
    const takeProfitDistance = 200 * priceAdjustment;
    const minProfit = 99999999 * priceAdjustment;

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

    const params = {
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
    };

    strategies.find(s => s.name === "EMA Crossover Longs")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params, strategies
    });
  }

  function shorts() {
    const priceAdjustment = 1 / 10000;

    const riskPercentage = 1;
    const priceOffset = 150 * priceAdjustment;

    const candlesAmountToBeConsideredHorizontalLevel = {
      future: 50,
      past: 15
    }

    const minStopLossDistance = 20 * priceAdjustment;
    const maxStopLossDistance = 1000 * priceAdjustment;
    const takeProfitDistance = 350 * priceAdjustment;
    const minProfit = 120 * priceAdjustment;

    const trailingSL = {
      tpDistanceShortForTighterSL: 0 * priceAdjustment,
      slDistanceWhenTpIsVeryClose: 0 * priceAdjustment
    }

    const trailingTP = {
      slDistanceShortForTighterTP: 40 * priceAdjustment,
      tpDistanceWhenSlIsVeryClose: -100 * priceAdjustment
    }

    const candlesAmountWithoutEMAsCrossing = 0;
    const maxSecondsOpenTrade = 0 * 24 * 60 * 60;

    const validHours: StrategyParams["validHours"] = [];
    const validMonths: StrategyParams["validMonths"] = [];
    const validDays: StrategyParams["validDays"] = [];

    const params = {
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
    };

    strategies.find(s => s.name === "EMA Crossover Shorts")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params, strategies
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
