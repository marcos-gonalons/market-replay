import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const minStopLossDistance of [50].map(sl => sl * priceAdjustment)) {
    for (const maxStopLossDistance of [300].map(sl => sl * priceAdjustment)) {
      for (const takeProfitDistance of [50].map(tp => tp * priceAdjustment)) {
        for (const futureCandles of [1]) {
          for (const pastCandles of [15]) {
            for (const priceOffset of [-10].map(po => po * priceAdjustment)) {
              for (const candlesAmountWithoutEMAsCrossing of [0]) {
                for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
                  for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
                      arr.push({
                        validHours,
                        validDays,
                        validMonths,
                        riskPercentage,
                        priceOffset,
                        candlesAmountToBeConsideredHorizontalLevel: {
                          future: futureCandles,
                          past: pastCandles
                        },
                        minStopLossDistance,
                        stopLossDistance: maxStopLossDistance,
                        takeProfitDistance,
                        tpDistanceShortForTighterSL,
                        slDistanceWhenTpIsVeryClose,
                        candlesAmountWithoutEMAsCrossing
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
