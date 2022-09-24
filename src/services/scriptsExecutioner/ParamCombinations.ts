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
  const priceAdjustment = 1 / 10000;
  const combinations: ParamCombinations = {
    riskPercentage: [1],

    takeProfitDistance: [25,50,75,100,125,150,175,200,225,250,275,300,325,350,375,400].map(tp => tp * priceAdjustment),
    maxStopLossDistance: [1000].map(sl => sl * priceAdjustment),
    minStopLossDistance: [0].map(sl => sl * priceAdjustment),
    priceOffset: [-300,-250,-200,-150,-100,-75,-50,-25,0,25,50,75,100,125,150].map(po => po * priceAdjustment),
    candlesAmountWithoutEMAsCrossing: [0,3,6,9,12,15,18,21,24,27,30],
    candlesAmountToBeConsideredHorizontalLevel: {
      future: [0,10,20,30,40],
      past: [0,10,20,30,40]
    },
    minProfit: [999999],
    trailingSL: {
      tpDistanceShortForTighterSL: [0],
      slDistanceWhenTpIsVeryClose: [0]
    },
    trailingTP: {
      slDistanceShortForTighterTP: [0],
      tpDistanceWhenSlIsVeryClose: [0]
    },
    maxSecondsOpenTrade: [0],
  }

  return { 
    combinations,
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
