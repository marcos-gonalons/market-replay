import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 100;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const minStopLossDistance of [0].map(sl => sl * priceAdjustment)) {
    for (const maxStopLossDistance of [160].map(sl => sl * priceAdjustment)) {
      for (const slDistanceWhenHorizontalLevelCantBeFound of [300].map(sl => sl * priceAdjustment)) {
        for (const takeProfitDistance of [200].map(tp => tp * priceAdjustment)) {
          for (const futureCandles of [40]) {
            for (const pastCandles of [20]) {
              for (const priceOffset of [40].map(po => po * priceAdjustment)) {
                for (const candlesAmountWithoutEMAsCrossing of [30]) {
                  for (const tpDistanceShortForTighterSL of [20].map((tp) => tp * priceAdjustment)) {
                    for (const slDistanceWhenTpIsVeryClose of [-40].map((tp) => tp * priceAdjustment)) {
                      for (const maxSecondsOpenTrade of [0]) {
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
                          maxStopLossDistance,
                          stopLossDistance: slDistanceWhenHorizontalLevelCantBeFound,
                          takeProfitDistance,
                          tpDistanceShortForTighterSL,
                          slDistanceWhenTpIsVeryClose,
                          candlesAmountWithoutEMAsCrossing,
                          maxSecondsOpenTrade
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
    }
  }

  return arr;
}
