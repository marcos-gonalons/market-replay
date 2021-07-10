import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 1000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const priceOffset of [-0.5, 0, 0.5].map((po) => po * priceAdjustment)) {
    //for (const tpDistanceShortForTighterSL of [0, 2, 4, 6, 8, 10].map((tp) => tp * priceAdjustment)) {
    //for (const slDistanceWhenTpIsVeryClose of [-10,-5,0,5,10].map((tp) => tp * priceAdjustment)) {
    for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
      for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
        for (const trendCandles of [30, 60, 90, 120, 150]) {
          for (const trendDiff of [10, 20, 30, 40, 50].map((td) => td * priceAdjustment)) {
            for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [21, 24, 27, 30]) {
              for (const takeProfitDistance of [37, 40, 43, 46, 49, 52].map((tp) => tp * priceAdjustment)) {
                for (const stopLossDistance of [23, 26, 29, 32, 35, 38].map((sl) => sl * priceAdjustment)) {
                  arr.push({
                    validHours,
                    validDays,
                    validMonths,
                    riskPercentage,
                    stopLossDistance,
                    takeProfitDistance,
                    tpDistanceShortForTighterSL,
                    slDistanceWhenTpIsVeryClose,
                    trendCandles,
                    trendDiff,
                    candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
                    priceOffset,
                    extraTrade: {
                      stopLossDistance,
                      takeProfitDistance,
                      tpDistanceShortForTighterSL,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return arr;
}
