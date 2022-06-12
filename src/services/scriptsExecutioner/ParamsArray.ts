import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];

  /**
   * 

{
{"validHours":[],"validDays":[],"validMonths":[],"riskPercentage":1,"stopLossDistance":23,"takeProfitDistance":27,"tpDistanceShortForTighterSL":0,"slDistanceWhenTpIsVeryClose":0,"trendCandles":0,"trendDiff":0,"candlesAmountWithLowerPriceToBeConsideredHorizontalLevel":85,"priceOffset":3,"maxSecondsOpenTrade":0,"extraTrade":{"stopLossDistance":23,"takeProfitDistance":27,"tpDistanceShortForTighterSL":0},"profits":773.7239999999902,"totalTrades":228}
  
   * 
   */

  for (const stopLossDistance of [19,23,27,31].map((sl) => sl * priceAdjustment)) {
    for (const takeProfitDistance of [25,27,30,33,36].map((tp) => tp * priceAdjustment)) {
      for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
        for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
          for (const trendCandles of [0].reverse()) {
            for (const trendDiff of [0].reverse().map((td) => td * priceAdjustment)) {
              for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [60,70,80,90,100]) {
                for (const priceOffset of [0].map((po) => po * priceAdjustment)) {
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
