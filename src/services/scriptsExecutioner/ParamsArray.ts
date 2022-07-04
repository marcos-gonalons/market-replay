import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const stopLossDistance of [10,30,60,80,100,120,140].map(sl => sl * priceAdjustment)) {
    for (const takeProfitDistance of [10,20,30,40,50,60].map(tp => tp * priceAdjustment)) {
      for (const candlesAmountWithoutEMAsCrossing of [0,5,10,15,20]) {
        for (const tpDistanceShortForTighterSL of [10,20,30,40,50,60].map((tp) => tp * priceAdjustment)) {
          for (const slDistanceWhenTpIsVeryClose of [-80,-40,0,40,80].map((tp) => tp * priceAdjustment)) {
              arr.push({
                validHours,
                validDays,
                validMonths,
                riskPercentage,
                stopLossDistance,
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

  return arr;
}
