import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (let priceOffset = 2; priceOffset < 3; priceOffset ++) {
    for (let tpD = 1; tpD < 6; tpD++) {
      for (const trendCandles of [90, 120, 150, 180, 210]) {
        for (const trendDiff of [5, 10, 15, 20, 25, 30, 35]) {
          for (let c = 11; c < 24; c++) {
            for (let takeProfitDistance = 27; takeProfitDistance < 28; takeProfitDistance++) {
              for (let stopLossDistance = 12; stopLossDistance < 13; stopLossDistance++) {
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
              }
            }
          }
        }
      }
    }
  }

  /**
   * Profits to beat
   *  422	645	39.55	2559.30	1067
   * 
   * 
   * 
   * 
   * 
   * Best so far, at 65%
   * {"riskPercentage":1.5,"stopLossDistance":12,"takeProfitDistance":27,"tpDistanceShortForBreakEvenSL":1,"trendCandles":90,"trendDiff":20,"candlesAmountWithLowerPriceToBeConsideredHorizontalLevel":21,"extraTrade":{"stopLossDistance":12,"takeProfitDistance":27,"tpDistanceShortForBreakEvenSL":1},"profits":473.76466666683336,"totalTrades":4071}
   */

  return arr;
}
