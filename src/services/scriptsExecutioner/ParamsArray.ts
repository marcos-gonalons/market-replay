import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const priceOffset of [-3, -1, 1, 3].map((po) => po * priceAdjustment)) {
    for (const tpDistanceShortForTighterSL of [10, 50, 100, 150].map((tp) => tp * priceAdjustment)) {
      for (const slDistanceWhenTpIsVeryClose of [-100, -50, 0, 50, 100].map((tp) => tp * priceAdjustment)) {
        for (const trendCandles of [0]) {
          for (const trendDiff of [0].map((td) => td * priceAdjustment)) {
            for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [20, 25, 30, 35, 40, 45]) {
              for (const takeProfitDistance of [310, 340, 370, 400, 430, 460, 490].map((tp) => tp * priceAdjustment)) {
                for (const stopLossDistance of [180, 210, 240, 270, 300, 330].map((sl) => sl * priceAdjustment)) {
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
