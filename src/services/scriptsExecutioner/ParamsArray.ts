import { ScriptParams } from "./Types";

const PARAMS_ARRAY: ScriptParams[] = [
  {
    riskPercentage: 1.5,
    stopLossDistance: 13,
    takeProfitDistance: 25,
    tpDistanceShortForBreakEvenSL: 5,
    trendCandles: 180,
    trendDiff: 5,
    candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: 18,
  },
  {
    riskPercentage: 1.5,
    stopLossDistance: 13,
    takeProfitDistance: 25,
    tpDistanceShortForBreakEvenSL: 5,
    trendCandles: 180,
    trendDiff: 5,
    candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: 15,
  },
  {
    riskPercentage: 1.5,
    stopLossDistance: 13,
    takeProfitDistance: 25,
    tpDistanceShortForBreakEvenSL: 5,
    trendCandles: 120,
    trendDiff: 10,
    candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: 15,
  },
];

export default PARAMS_ARRAY;
