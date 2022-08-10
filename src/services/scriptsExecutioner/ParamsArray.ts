import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const minStopLossDistance of [0].map(sl => sl * priceAdjustment)) {
    for (const maxStopLossDistance of [250].map(sl => sl * priceAdjustment)) {
      for (const takeProfitDistance of [100].map(tp => tp * priceAdjustment)) {
        for (const futureCandles of [15]) {
          for (const pastCandles of [30]) {
            for (const priceOffset of [-60].map(po => po * priceAdjustment)) {
              for (const candlesAmountWithoutEMAsCrossing of [25]) {
                for (const tpDistanceShortForTighterSL of [0,10,20,30,40,50,60,70,80,90].map((tp) => tp * priceAdjustment)) {
                  for (const slDistanceWhenTpIsVeryClose of [-220,-190,-160,-130,-100,-70,-40,-30,-10,0,10,20,30,40,50,60,70,80,90].map((tp) => tp * priceAdjustment)) {
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

  return arr;
}
