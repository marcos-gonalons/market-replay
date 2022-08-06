import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 100;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];

  for (const minStopLossDistance of [280].map(sl => sl * priceAdjustment)) {
    for (const maxStopLossDistance of [300].map(sl => sl * priceAdjustment)) {
      for (const takeProfitDistance of [70].map(tp => tp * priceAdjustment)) {
        for (const futureCandles of [25]) {
          for (const pastCandles of [40]) {
            for (const priceOffset of [-10].map(po => po * priceAdjustment)) {
              for (const candlesAmountWithoutEMAsCrossing of [50]) {
                for (const tpDistanceShortForTighterSL of [0,10,20,30,40,50,60].map((tp) => tp * priceAdjustment)) {
                  for (const slDistanceWhenTpIsVeryClose of [-260,-240,-220,-200,-180,-160,-140,-120,-100,-80,-60,-40,-20,0,10,20,30,40,50,60].map((tp) => tp * priceAdjustment)) {
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
                        stopLossDistance: maxStopLossDistance,
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
