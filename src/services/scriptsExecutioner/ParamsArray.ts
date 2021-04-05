import { ScriptParams } from "./Types";

export default function getParamsArray(): ScriptParams[] {
  const arr: ScriptParams[] = [];

  const riskPercentage = 1.5;
  const tpDistanceShortForBreakEvenSL = 1;

  for (const trendCandles of [180]) {
    for (let trendDiff = 0; trendDiff < 0; trendDiff++) {
      for (let c = 12; c < 20; c++) {
        for (let takeProfitDistance = 20; takeProfitDistance < 30; takeProfitDistance++) {
          for (let stopLossDistance = 10; stopLossDistance < 15; stopLossDistance++) {
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
