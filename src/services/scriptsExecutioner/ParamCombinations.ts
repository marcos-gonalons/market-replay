import { StrategyParams } from "./Types";

export interface ParamCombinations {
  minStopLossDistance: StrategyParams['minStopLossDistance'][];
  riskPercentage: StrategyParams['riskPercentage'][];
  priceOffset: StrategyParams['priceOffset'][];
  maxAttemptsToGetSL: number[];
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
  candlesAmountWithoutEMAsCrossing: number[];
  maxSecondsOpenTrade: StrategyParams['maxSecondsOpenTrade'][];
}

export default function getCombinations():  {
  combinations: ParamCombinations,
  length: number
} {
  const priceAdjustment = 1/10000;
  const combinations: ParamCombinations = {
    riskPercentage: [1],

    priceOffset: [40,50,60,70,75,80,90,100].map(po => po * priceAdjustment),
    maxAttemptsToGetSL: [10,20,30,40],
    candlesAmountToBeConsideredHorizontalLevel: {
      future: [30],
      past: [40]
    },
    minStopLossDistance: [50].map(sl => sl * priceAdjustment),
    maxStopLossDistance: [580].map(sl => sl * priceAdjustment),
    takeProfitDistance: [230,240,250,260,270,280].map(tp => tp * priceAdjustment),
    minProfit: [999999].map(mp => mp * priceAdjustment),
    trailingSL: {
      tpDistanceShortForTighterSL: [30].map(tp => tp * priceAdjustment),
      slDistanceWhenTpIsVeryClose: [-90].map(sl => sl * priceAdjustment)
    },
    trailingTP: {
      slDistanceShortForTighterTP: [100].map(sl => sl * priceAdjustment),
      tpDistanceWhenSlIsVeryClose: [-20].map(tp => tp * priceAdjustment)
    },
    candlesAmountWithoutEMAsCrossing: [12],
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
      combinations.maxAttemptsToGetSL.length *
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
