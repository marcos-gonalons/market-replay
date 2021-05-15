import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const priceOffset of [0,1,2,3,4,5]) {
  for (const tpDistanceShortForBreakEvenSL of [0]) {
  for (const trendCandles of [90,120]) {
  for (const trendDiff of [30]) {
  for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [14]) {
  for (const takeProfitDistance of [34]) {
  for (const stopLossDistance of [15]) {
    arr.push({
      validHours,
      validDays,
      validMonths,
      riskPercentage,
      stopLossDistance,
      takeProfitDistance,
      tpDistanceShortForBreakEvenSL,
      trendCandles,
      trendDiff,
      candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
      priceOffset,
      extraTrade: {
        stopLossDistance,
        takeProfitDistance,
        tpDistanceShortForBreakEvenSL
      }
    });
  }}}}}}}

  return arr;
}
