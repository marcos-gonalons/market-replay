import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const tpDistanceShortForBreakEvenSL = 1;

  /**
   * 
   * todo: add price offset (currently it's 2)
   * 
   */

  for (let tpD = 1; tpD < 6; tpD++) {
    for (const trendCandles of [90, 120, 150, 180, 210]) {
      for (const trendDiff of [5, 10, 15, 20, 25, 30, 35]) {
        for (let c = 11; c < 24; c++) {
          for (let takeProfitDistance = 27; takeProfitDistance < 28; takeProfitDistance++) {
            for (let stopLossDistance = 12; stopLossDistance < 13; stopLossDistance++) {
              arr.push({
                riskPercentage,
                stopLossDistance,
                takeProfitDistance,
                tpDistanceShortForBreakEvenSL: tpD,
                trendCandles,
                trendDiff,
                candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: c,
                extraTrade: {
                  stopLossDistance,
                  takeProfitDistance,
                  tpDistanceShortForBreakEvenSL
                }
              });
            }
          }
        }
      }
    }
  }

  return arr;
}
