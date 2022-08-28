import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const minStopLossDistance of [0].map(sl => sl * priceAdjustment)) {
    for (const maxStopLossDistance of [320].map(sl => sl * priceAdjustment)) {
      for (const takeProfitDistance of [160].map(tp => tp * priceAdjustment)) {
        for (const futureCandles of [10]) {
          for (const pastCandles of [20]) {
            for (const priceOffset of [20].map(po => po * priceAdjustment)) {
              for (const candlesAmountWithoutEMAsCrossing of [45]) {
                for (const tpDistanceShortForTighterSL of [40].map((tp) => tp * priceAdjustment)) {
                  for (const slDistanceWhenTpIsVeryClose of [-120].map((tp) => tp * priceAdjustment)) {
                    for (const slDistanceShortForTighterTP of [0,10,30,50,70,90,110,130,150,170,190,210].map((tp) => tp * priceAdjustment)) {
                      for (const tpDistanceWhenSlIsVeryClose of [-150,-140,-130,-120,-110,-100,-90,-80,-70,-60,-50,-40,-30,-20,-10,0,10,30,50,70,90,110,130,150,170,190,210].map((tp) => tp * priceAdjustment)) {
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

  return arr;
}
