import { Order } from "../../context/tradesContext/Types";
import { StrategyParams } from "./Types";

export interface ParamCombinations {
  minStopLossDistance: StrategyParams['minStopLossDistance'][];
  riskPercentage: StrategyParams['riskPercentage'][];
  maxAttemptsToGetSL: number[];
  candlesAmountToBeConsideredHorizontalLevel: {
    future: number[],
    past: number[]
  };
  maxStopLossDistance: StrategyParams['maxStopLossDistance'][];
  takeProfitDistance: StrategyParams['takeProfitDistance'][];
  stopLossDistance: StrategyParams['stopLossDistance'][];
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

  ranges: {
    candlesToCheck: number[];
    maxPriceDifferenceForSameHorizontalLevel: number[];
    minPriceDifferenceBetweenRangePoints: number[];
    minCandlesBetweenRangePoints: number[];
    maxCandlesBetweenRangePoints: number[];
    minimumDistanceToLevel: number[];
    priceOffset: number[];
    rangePoints: number[];
    startWith: ("support"|"resistance")[];
    takeProfitStrategy: ("level" | "half" | "levelWithOffset" | "distance")[];
    stopLossStrategy: ("level" | "half" | "levelWithOffset" | "distance")[];
    orderType: Order["type"][];
    trendyOnly: boolean[];
  }
}

export default function getCombinations():  {
  combinations: ParamCombinations,
  length: number
} {
  const priceAdjustment = 1/10000;
  const combinations: ParamCombinations = {
    // not used for ranges
    maxAttemptsToGetSL: [0],
    minStopLossDistance: [0].map(sl => sl * priceAdjustment),
    candlesAmountWithoutEMAsCrossing: [0],
    minProfit: [999999].map(mp => mp * priceAdjustment),
    ////////////////////////////////////////////////////////////

    /*
      {"riskPercentage":1,"priceOffset":0,"maxAttemptsToGetSL":0,"stopLossDistance":0.003,"candlesAmountToBeConsideredHorizontalLevel":{"future":10,"past":3},"minStopLossDistance":0,"maxStopLossDistance":0.045000000000000005,"takeProfitDistance":0.01,"minProfit":99.99990000000001,"trailingSL":{"tpDistanceShortForTighterSL":0,"slDistanceWhenTpIsVeryClose":0},"trailingTP":{"slDistanceShortForTighterTP":0,"tpDistanceWhenSlIsVeryClose":0},"candlesAmountWithoutEMAsCrossing":0,"maxSecondsOpenTrade":0,"ranges":{"candlesToCheck":400,"maxPriceDifferenceForSameHorizontalLevel":0.005,"minPriceDifferenceBetweenRangePoints":0.01,"minCandlesBetweenRangePoints":5,"maxCandlesBetweenRangePoints":150,"priceOffset":-0.005,"rangePoints":3,"startWith":"support","takeProfitStrategy":"distance","stopLossStrategy":"levelWithOffset","orderType":"sell-stop","trendyOnly":false},"profits":2969.647656250057,"totalTrades":117}
    */

    riskPercentage: [1],
    maxSecondsOpenTrade: [0],
    trailingSL: {
      tpDistanceShortForTighterSL: [0].map(tp => tp * priceAdjustment),
      slDistanceWhenTpIsVeryClose: [0].map(sl => sl * priceAdjustment)
    },
    trailingTP: {
      slDistanceShortForTighterTP: [0].map(sl => sl * priceAdjustment),
      tpDistanceWhenSlIsVeryClose: [0].map(tp => tp * priceAdjustment)
    },

    candlesAmountToBeConsideredHorizontalLevel: {
      future: [3,10],
      past: [3,10]
    },
    maxStopLossDistance: [450].map(sl => sl * priceAdjustment),
    takeProfitDistance: [50,75,100,125,150].map(tp => tp * priceAdjustment),
    stopLossDistance: [-30,0,30,60,90].map(tp => tp * priceAdjustment),
    ranges: {
      candlesToCheck: [400],
      maxPriceDifferenceForSameHorizontalLevel: [75,50,25].map(p => p * priceAdjustment),
      minPriceDifferenceBetweenRangePoints: [25,50,75,100,140].map(p => p * priceAdjustment),
      minCandlesBetweenRangePoints: [5],
      maxCandlesBetweenRangePoints: [150],
      minimumDistanceToLevel: [10].map(p => p * priceAdjustment),
      priceOffset: [-150,-110,-80,-50,-20,0].map(p => p * priceAdjustment),
      rangePoints: [3],
      startWith: ["support"],
      takeProfitStrategy: ["distance"],
      stopLossStrategy: ["levelWithOffset"],
      orderType: ["sell-stop"],
      trendyOnly: [false]
    }
  }

  return { 
    combinations,
    // todo: simplify this, get all the arrays in a dynamic way
    length: (
      combinations.riskPercentage.length *
      combinations.takeProfitDistance.length *
      combinations.stopLossDistance.length *
      combinations.maxStopLossDistance.length *
      combinations.minStopLossDistance.length *
      combinations.maxAttemptsToGetSL.length *
      combinations.candlesAmountWithoutEMAsCrossing.length *
      combinations.candlesAmountToBeConsideredHorizontalLevel.future.length *
      combinations.candlesAmountToBeConsideredHorizontalLevel.past.length *
      combinations.minProfit.length *
      combinations.trailingSL.tpDistanceShortForTighterSL.length *
      combinations.trailingSL.slDistanceWhenTpIsVeryClose.length *
      combinations.trailingTP.slDistanceShortForTighterTP.length *
      combinations.trailingTP.tpDistanceWhenSlIsVeryClose.length *
      combinations.maxSecondsOpenTrade.length *
      combinations.ranges.candlesToCheck.length *
      combinations.ranges.maxPriceDifferenceForSameHorizontalLevel.length *
      combinations.ranges.minPriceDifferenceBetweenRangePoints.length *
      combinations.ranges.minCandlesBetweenRangePoints.length *
      combinations.ranges.maxCandlesBetweenRangePoints.length *
      combinations.ranges.priceOffset.length *
      combinations.ranges.rangePoints.length *
      combinations.ranges.startWith.length *
      combinations.ranges.takeProfitStrategy.length *
      combinations.ranges.stopLossStrategy.length *
      combinations.ranges.orderType.length *
      combinations.ranges.trendyOnly.length
    )
  };
}
