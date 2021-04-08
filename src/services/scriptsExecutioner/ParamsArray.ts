import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const tpDistanceShortForBreakEvenSL = 1;

  for (const trendCandles of [60, 90, 120, 150, 180, 210, 240, 270, 300]) {
    for (let trendDiff = 5; trendDiff < 30; trendDiff++) {
      for (let c = 15; c < 16; c++) {
        for (let takeProfitDistance = 29; takeProfitDistance < 30; takeProfitDistance++) {
          for (let stopLossDistance = 14; stopLossDistance < 15; stopLossDistance++) {
            arr.push({
              riskPercentage,
              stopLossDistance,
              takeProfitDistance,
              tpDistanceShortForBreakEvenSL,
              trendCandles,
              trendDiff,
              candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: c,
            });
          }
        }
      }
    }
  }

  return arr;

  return [
    {
      riskPercentage: 1.5,
      stopLossDistance: 13,
      takeProfitDistance: 25,
      tpDistanceShortForBreakEvenSL: 5,
      trendCandles: 180,
      trendDiff: 5,
      candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: 15,
    },
  ];
}
