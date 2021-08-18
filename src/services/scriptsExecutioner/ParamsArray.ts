import { ScriptParams } from "./Types";

// gbpusd 1h support
/*
{"validHours":[],"validDays":[],"validMonths":[],"riskPercentage":1.5,"stopLossDistance":0.015000000000000001,"takeProfitDistance":0.05,"tpDistanceShortForTighterSL":0,"slDistanceWhenTpIsVeryClose":0,"trendCandles":0,"trendDiff":0,"candlesAmountWithLowerPriceToBeConsideredHorizontalLevel":50,"priceOffset":-0.0005,"maxSecondsOpenTrade":0,"extraTrade":{"stopLossDistance":0.015000000000000001,"takeProfitDistance":0.05,"tpDistanceShortForTighterSL":0},"profits":9851.500000000047,"totalTrades":187}
*/

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const priceAdjustment = 1 / 10000;

  const validHours: ScriptParams["validHours"] = [];
  const validDays: ScriptParams["validDays"] = [];
  const validMonths: ScriptParams["validMonths"] = [];

  for (const stopLossDistance of [100,150,200,250,300,350,400,450,500].map((sl) => sl * priceAdjustment)) {
    for (const takeProfitDistance of [100,150,200,250,300,350,400,450,500].map((tp) => tp * priceAdjustment)) {
      for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
        for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
          for (const trendCandles of [0]) {
            for (const trendDiff of [0].map((td) => td * priceAdjustment)) {
              for (const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel of [15,20,25,30,35,40,45,50,100,150,200,250]) {
                for (const priceOffset of [-20,-15,-10,-5,0,5,10,15,20].map((po) => po * priceAdjustment)) {
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
