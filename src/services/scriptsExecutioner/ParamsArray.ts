import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const maxStopLossDistance of [300].map(sl => sl * priceAdjustment)) {
    for (const takeProfitDistance of [10,30,50,70,90,110,130,150,170,190,210,230].map(tp => tp * priceAdjustment)) {
      for (const futureCandles of [2]) {
        for (const pastCandles of [5,15,25,35]) {
          for (const priceOffset of [-30,-25,-20,-15,-10,-5,0,5,10]) {
            for (const candlesAmountWithoutEMAsCrossing of [10,20,30,40]) {
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

  return arr;
}
