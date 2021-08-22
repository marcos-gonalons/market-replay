import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const stopLossDistance of [340].map((sl) => sl * priceAdjustment)) {
    for (const takeProfitDistance of [60].map((tp) => tp * priceAdjustment)) {
      for (const tpDistanceShortForTighterSL of [10].map((tp) => tp * priceAdjustment)) {
        for (const slDistanceWhenTpIsVeryClose of [-190].map((tp) => tp * priceAdjustment)) {
          for (const trendCandles of [12]) {
            for (const trendDiff of [40].map((td) => td * priceAdjustment)) {
              for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [30]) {
                for (const priceOffset of [36].map((po) => po * priceAdjustment)) {
                  for (const maxSecondsOpenTrade of [
                    5 * 24 * 60 * 60,
                    10 * 24 * 60 * 60,
                    15 * 24 * 60 * 60,
                    20 * 24 * 60 * 60,
                    25 * 24 * 60 * 60,
                    30 * 24 * 60 * 60,
                    35 * 24 * 60 * 60,
                    45 * 24 * 60 * 60,
                    50 * 24 * 60 * 60,
                    55 * 24 * 60 * 60,
                    60 * 24 * 60 * 60,
                    65 * 24 * 60 * 60,
                  ]) {
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
