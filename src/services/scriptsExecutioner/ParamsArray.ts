import { StrategyParams } from "./Types";

export default function getParamsArray(): StrategyParams[] {
  const arr: StrategyParams[] = [];

  const riskPercentage = 1;
  const priceAdjustment = 1 / 10000;

  const validHours: StrategyParams["validHours"] = [];
  const validDays: StrategyParams["validDays"] = [];
  const validMonths: StrategyParams["validMonths"] = [];


  for (const stopLossDistance of [10].map(sl => sl * priceAdjustment)) {
    for (const takeProfitDistance of [15].map(tp => tp * priceAdjustment)) {
      for (const candlesAmountWithoutEMAsCrossing of [10]) {
        for (const tpDistanceShortForTighterSL of [0].map((tp) => tp * priceAdjustment)) {
          for (const slDistanceWhenTpIsVeryClose of [0].map((tp) => tp * priceAdjustment)) {
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
