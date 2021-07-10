import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 1000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const priceOffset of [-0.5].map((po) => po * priceAdjustment)) {
    for (const tpDistanceShortForTighterSL of [1, 5, 10, 15, 20, 25].map((tp) => tp * priceAdjustment)) {
      for (const slDistanceWhenTpIsVeryClose of [-15, -10, -5, 0, 5, 10, 15].map((tp) => tp * priceAdjustment)) {
        for (const trendCandles of [30]) {
          for (const trendDiff of [10].map((td) => td * priceAdjustment)) {
            for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [21]) {
              for (const takeProfitDistance of [37].map((tp) => tp * priceAdjustment)) {
                for (const stopLossDistance of [29].map((sl) => sl * priceAdjustment)) {
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
