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


  function getParams(params: StrategyParams | null): StrategyParams {
    if (params) {
      return params;
    }
    const priceAdjustment = 1 / 10000;

    const riskPercentage = 1;
    const minStopLossDistance = 0 * priceAdjustment;
    const maxStopLossDistance = 300 * priceAdjustment;
    const candlesAmountToBeConsideredHorizontalLevel = {
      future: 40,
      past: 40
    }
    const priceOffset = -100 * priceAdjustment;
    const takeProfitDistance = 290 * priceAdjustment;
    const tpDistanceShortForTighterSL = 0 * priceAdjustment;
    const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
    const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
    const candlesAmountWithoutEMAsCrossing = 40;

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
      tpDistanceShortForTighterSL,
      slDistanceWhenTpIsVeryClose,
      candlesAmountWithoutEMAsCrossing,
      maxSecondsOpenTrade,
    };
  }

  strategies.find(s => s.name === "EMA Crossover")!.func({
    candles, orders, trades, balance, currentDataIndex, spread,
    createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
    params: getParams(params || null), strategies
  });

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
