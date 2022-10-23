import { StrategyParams } from "./Types";

export interface ParamCombinations {
  minStopLossDistance: StrategyParams['minStopLossDistance'][];
  riskPercentage: StrategyParams['riskPercentage'][];
  priceOffset: StrategyParams['priceOffset'][];
  candlesAmountToBeConsideredHorizontalLevel: {
    future: number[],
    past: number[]
  };
  maxStopLossDistance: StrategyParams['maxStopLossDistance'][];
  takeProfitDistance: StrategyParams['takeProfitDistance'][];
  minProfit: StrategyParams['minProfit'][];
  trailingSL: {
    tpDistanceShortForTighterSL: number[];
    slDistanceWhenTpIsVeryClose: number[];
  };
  trailingTP: {
    slDistanceShortForTighterTP: number[];
    tpDistanceWhenSlIsVeryClose: number[];
  }
  candlesAmountWithoutEMAsCrossing: StrategyParams['candlesAmountWithoutEMAsCrossing'][];
  maxSecondsOpenTrade: StrategyParams['maxSecondsOpenTrade'][];
}

export default function getCombinations():  {
  combinations: ParamCombinations,
  length: number
} {
  const priceAdjustment = 1/10000;
  const combinations: ParamCombinations = {
    riskPercentage: [1],

    priceOffset: [20].map(po => po * priceAdjustment),
    candlesAmountToBeConsideredHorizontalLevel: {
      future: [0],
      past: [0]
    },
    minStopLossDistance: [0].map(sl => sl * priceAdjustment),
    maxStopLossDistance: [900].map(sl => sl * priceAdjustment),
    takeProfitDistance: [160].map(tp => tp * priceAdjustment),
    minProfit: [100].map(mp => mp * priceAdjustment),
    trailingSL: {
      tpDistanceShortForTighterSL: [0].map(tp => tp * priceAdjustment),
      slDistanceWhenTpIsVeryClose: [0].map(sl => sl * priceAdjustment)
    },
    trailingTP: {
      slDistanceShortForTighterTP: [0,20,40,60,80,100,120,140,160,200,180,220,240,260,280].map(sl => sl * priceAdjustment),
      tpDistanceWhenSlIsVeryClose: [-150,-130,-110,-90,-70,-50,-30,-10,0,20,40,60,80,100,120,140,160,200,180,220,240,260,280].map(tp => tp * priceAdjustment)
    },
    candlesAmountWithoutEMAsCrossing: [3],
    maxSecondsOpenTrade: [0],
  }

  return { 
    combinations,
    // todo: simplify this, get all the arrays in a dynamic way
    length: (
      combinations.riskPercentage.length *
      combinations.takeProfitDistance.length *
      combinations.maxStopLossDistance.length *
      combinations.minStopLossDistance.length *
      combinations.priceOffset.length *
      combinations.candlesAmountWithoutEMAsCrossing.length *
      combinations.candlesAmountToBeConsideredHorizontalLevel.future.length *
      combinations.candlesAmountToBeConsideredHorizontalLevel.past.length *
      combinations.minProfit.length *
      combinations.trailingSL.tpDistanceShortForTighterSL.length *
      combinations.trailingSL.slDistanceWhenTpIsVeryClose.length *
      combinations.trailingTP.slDistanceShortForTighterTP.length *
      combinations.trailingTP.tpDistanceWhenSlIsVeryClose.length *
      combinations.maxSecondsOpenTrade.length
    )
  };
}
