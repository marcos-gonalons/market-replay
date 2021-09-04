import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const stopLossDistance of [180].map((sl) => sl * priceAdjustment)) {
    for (const takeProfitDistance of [90].map((tp) => tp * priceAdjustment)) {
      for (const tpDistanceShortForTighterSL of [30].map((tp) => tp * priceAdjustment)) {
        for (const slDistanceWhenTpIsVeryClose of [-170].map((tp) => tp * priceAdjustment)) {
          for (const trendCandles of [110]) {
            for (const trendDiff of [50].map((td) => td * priceAdjustment)) {
              for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [20]) {
                for (const priceOffset of [30].map((po) => po * priceAdjustment)) {
                  for (const maxSecondsOpenTrade of [35 * 24 * 60 * 60]) {
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
