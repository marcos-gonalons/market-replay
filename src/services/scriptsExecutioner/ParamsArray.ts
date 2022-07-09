import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const stopLossDistance of [120].map(sl => sl * priceAdjustment)) {
    for (const takeProfitDistance of [90].map(tp => tp * priceAdjustment)) {
      for (const candlesAmountWithoutEMAsCrossing of [20]) {
        for (const tpDistanceShortForTighterSL of [10,20,30,40,50,60,70,80].map((tp) => tp * priceAdjustment)) {
          for (const slDistanceWhenTpIsVeryClose of [-110,-90,-70,-50,-30,-10,0,10,20,30,40,50,60,70,80].map((tp) => tp * priceAdjustment)) {
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
