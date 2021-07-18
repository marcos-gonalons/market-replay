import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const priceOffset of [-13].map((po) => po * priceAdjustment)) {
    for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
      for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
        for (const trendCandles of [72]) {
          for (const trendDiff of [10].map((td) => td * priceAdjustment)) {
            for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [27]) {
              for (const takeProfitDistance of [370].map((tp) => tp * priceAdjustment)) {
                for (const stopLossDistance of [180].map((sl) => sl * priceAdjustment)) {
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
