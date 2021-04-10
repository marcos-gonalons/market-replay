import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (let priceOffset = 0; priceOffset < 6; priceOffset ++) {
  for (let tpD = 1; tpD < 7; tpD++) {
  for (const trendCandles of [90]) {
  for (const trendDiff of [5,10,15,20,25,30]) {
  for (let c = 21; c < 22; c++) {
  for (let takeProfitDistance = 34; takeProfitDistance < 35; takeProfitDistance++) {
  for (let stopLossDistance = 16; stopLossDistance < 17; stopLossDistance++) {
    arr.push({
      validHours,
      validDays,
      validMonths,
      riskPercentage,
      stopLossDistance,
      takeProfitDistance,
      tpDistanceShortForBreakEvenSL: tpD,
      trendCandles,
      trendDiff,
      candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: c,
      priceOffset,
      extraTrade: {
        stopLossDistance,
        takeProfitDistance,
        tpDistanceShortForBreakEvenSL: tpD
      }
    });
  }}}}}}}

  /**
      {"validHours":[],"validDays":[],"validMonths":[],"riskPercentage":1.5,"stopLossDistance":16,"takeProfitDistance":34,"tpDistanceShortForBreakEvenSL":2,"trendCandles":90,"trendDiff":5,"candlesAmountWithLowerPriceToBeConsideredHorizontalLevel":21,"priceOffset":1,"extraTrade":{"stopLossDistance":16,"takeProfitDistance":34,"tpDistanceShortForBreakEvenSL":2},"profits":3792.886333333834,"totalTrades":6121}
   */

  return arr;
}
