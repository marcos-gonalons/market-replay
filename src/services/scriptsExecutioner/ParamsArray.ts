import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const stopLossDistance of [120, 130, 140, 160, 170, 180].map((sl) => sl * priceAdjustment)) {
    for (const takeProfitDistance of [460, 470, 480, 490, 500, 510, 520, 530, 540, 550, 560].map(
      (tp) => tp * priceAdjustment
    )) {
      for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
        for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
          for (const trendCandles of [0]) {
            for (const trendDiff of [0].map((td) => td * priceAdjustment)) {
              for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [
                46,
                48,
                50,
                52,
                54,
                56,
                58,
                60,
                70,
                80,
              ]) {
                for (const priceOffset of [-9, -8, -7, -6, -5, -4, -3, -2].map((po) => po * priceAdjustment)) {
                  for (const maxSecondsOpenTrade of [0]) {
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
