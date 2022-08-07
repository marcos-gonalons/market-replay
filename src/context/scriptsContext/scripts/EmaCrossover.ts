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
    const priceAdjustment = 1 / 100;

    const riskPercentage = 1;
    const slDistanceWhenHorizontalLevelCantBeFound = 300 * priceAdjustment;
    const minStopLossDistance = 0 * priceAdjustment;
    const maxStopLossDistance = 160 * priceAdjustment;
    const candlesAmountToBeConsideredHorizontalLevel = {
      future: 40,
      past: 20
    }
    const priceOffset = 40 * priceAdjustment;
    const takeProfitDistance = 200 * priceAdjustment;
    const tpDistanceShortForTighterSL = 20 * priceAdjustment;
    const slDistanceWhenTpIsVeryClose = -40 * priceAdjustment;
    const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
    const candlesAmountWithoutEMAsCrossing = 30;

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
      slDistanceWhenHorizontalLevelCantBeFound,
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
