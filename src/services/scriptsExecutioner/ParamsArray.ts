import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (let priceOffset = 0; priceOffset < 5; priceOffset ++) {
  for (let tpD = 1; tpD < 6; tpD++) {
  for (const trendCandles of [90,120]) {
  for (const trendDiff of [30]) {
  for (let c = 14; c < 15; c++) {
  for (let takeProfitDistance = 34; takeProfitDistance < 35; takeProfitDistance++) {
  for (let stopLossDistance = 15; stopLossDistance < 16; stopLossDistance++) {
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
   * To beat
   * {"validHours":[],"validDays":[],"validMonths":[],"riskPercentage":1.5,"stopLossDistance":15,"takeProfitDistance":34,"tpDistanceShortForBreakEvenSL":1,"trendCandles":90,"trendDiff":30,"candlesAmountWithLowerPriceToBeConsideredHorizontalLevel":14,"priceOffset":2,"extraTrade":{"stopLossDistance":15,"takeProfitDistance":34,"tpDistanceShortForBreakEvenSL":1},"profits":4026.586333333409,"totalTrades":3323}
   */

  return arr;
}
