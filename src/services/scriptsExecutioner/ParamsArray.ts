import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const minStopLossDistance of [0].map(sl => sl * priceAdjustment)) {
    for (const maxStopLossDistance of [1000].map(sl => sl * priceAdjustment)) {
      for (const takeProfitDistance of [25,50,75,100,125,150,175,200,225,250,275,300,325,350,375,400].map(tp => tp * priceAdjustment)) {
        for (const minProfit of [999999].map(tp => tp * priceAdjustment)) {
          for (const futureCandles of [0,10,20,30,40]) {
            for (const pastCandles of [0,10,20,30,40]) {
              for (const priceOffset of [-300,-250,-200,-150,-100,-75,-50,-25,0,25,50,75,100,125,150].map(po => po * priceAdjustment)) {
                for (const candlesAmountWithoutEMAsCrossing of [0,3,6,9,12,15,18,21,24,27,30]) {
                  for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
                    for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
                      for (const slDistanceShortForTighterTP of [0].map((tp) => tp * priceAdjustment)) {
                      for (const tpDistanceWhenSlIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
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
                              takeProfitDistance,
                              minProfit,
                              trailingSL: {
                                tpDistanceShortForTighterSL,
                                slDistanceWhenTpIsVeryClose,
                              },
                              trailingTP: {
                                slDistanceShortForTighterTP,
                                tpDistanceWhenSlIsVeryClose
                              },
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
    }
  }

  return arr;
}
