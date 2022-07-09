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
    const stopLossDistance = 30 * priceAdjustment;
    const takeProfitDistance = 30 * priceAdjustment;
    const tpDistanceShortForTighterSL = 0 * priceAdjustment;
    const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
    const maxSecondsOpenTrade = 0 * 24 * 60 * 60;
    const candlesAmountWithoutEMAsCrossing = 0;

    const validHours: StrategyParams["validHours"] = [];
    const validMonths: StrategyParams["validMonths"] = [];
    const validDays: StrategyParams["validDays"] = [];

    return {
      validHours,
      validDays,
      validMonths,
      riskPercentage,
      stopLossDistance,
      takeProfitDistance,
      tpDistanceShortForTighterSL,
      slDistanceWhenTpIsVeryClose,
      candlesAmountWithoutEMAsCrossing,
      maxSecondsOpenTrade,
    };
  }

  // TODO: Define params
  /**
    stopLossDistance
      SL Can be a fixed distance, or it can be the latest low
        - If it's the latest low, I must define the candlesAmountToBeConsideredHorizontalLevel

      Can be a mix of both: define a max SL distance, if the latest low > max, then use max.
    
    candlesAmountWithoutCrossing
      Amount of days the small EMA must be below/above the big EMA to be a valid setup

    Another potential approach: on successful setup, create limit order instead of market order
    to wait for the retracement

  Next steps
    - Do some runs for 15m and 5m for each forex pair with different parameters (execute with full data 2)
    - Write down the results
    - Analyze the results
      - Decide if we should implement the other approach with limit order on crossover instead of market order.
        - Or another approach: only execute the trade if the candle.open is < than the 9 ema, for example
          or is > than 9 ema but by very little. Define the distance, and check
      - Decide the stop loss strategy -> fixed distance, or latest low

   */

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
