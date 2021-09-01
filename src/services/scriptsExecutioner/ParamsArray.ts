import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const stopLossDistance of [200].map((sl) => sl * priceAdjustment)) {
    for (const takeProfitDistance of [120].map((tp) => tp * priceAdjustment)) {
      for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
        for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
          for (const trendCandles of [180]) {
            for (const trendDiff of [70].map((td) => td * priceAdjustment)) {
              for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [50]) {
                for (const priceOffset of [30].map((po) => po * priceAdjustment)) {
                  for (const maxSecondsOpenTrade of [18 * 24 * 60 * 60]) {
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
                      maxSecondsOpenTrade,
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
  }

  return arr;
}
