import { StrategyParams } from "../../../../services/scriptsExecutioner/Types";
import { Candle } from "../../../globalContext/Types";
import { get as GetHorizontalLevel } from "./GetHorizontalLevel";

export type RangePoint = {
    candle: Candle;
    index: number;
    type: "resistance" | "support" 
};
type Range = RangePoint[];
type GetRangeParams = {
    readonly candles: Candle[]
    readonly currentCandle: Candle;
    readonly currentDataIndex: number;
    readonly strategyParams: StrategyParams
}

export function get({
  candles,
  currentCandle,
  currentDataIndex,
  strategyParams
}: GetRangeParams): Range | null {
  let currentRangePoint = 1;
  let levelToGet = strategyParams!.ranges!.startWith;
  let index = currentDataIndex;
  let candlesToCheck = strategyParams!.ranges!.candlesToCheck;
  const range: Range = [];
  while (currentRangePoint <= strategyParams!.ranges!.rangePoints) {
    const [_, foundAt] = GetHorizontalLevel({
      resistanceOrSupport: levelToGet,
      currentDataIndex: index,
      candlesAmountToBeConsideredHorizontalLevel: strategyParams!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: 0,
      candles,
      candlesToCheck
    });
    void _;

    if (!foundAt) {
      break;
    }

    const level = { type: levelToGet, index: foundAt, candle: candles[foundAt] };

    if (!validateRangeLevel(level, range)) {
      break;
    }

    range.push(level);

    index = foundAt-strategyParams!.ranges!.minCandlesBetweenRangePoints;
    candlesToCheck = strategyParams!.ranges!.maxCandlesBetweenRangePoints;
    currentRangePoint++;

    levelToGet = levelToGet === "support" ? "resistance" : "support";
  }

  if (currentRangePoint <= strategyParams!.ranges!.rangePoints) {
    return null;
  }



  return range;

  function validateRangeLevel(level: RangePoint, range: Range): boolean {
    if (level.type === "resistance") {
      if (level.candle.high <= currentCandle.close) {
        return false;
      }

      for (const l of range) {
        if (l.type === "support") {
          if (level.candle.high - l.candle.low < strategyParams!.ranges!.minPriceDifferenceBetweenRangePoints) {
            return false;
          }

          for (let i = level.index+1; i < l.index; i++) {
            if (candles[i].high > level.candle.high) {
              return false;
            }
          }
        } else {
          if (Math.abs(l.candle.high-level.candle.high) > strategyParams!.ranges!.maxPriceDifferenceForSameHorizontalLevel) {
            return false;
          }
        }
      }
    }
    if (level.type === "support") {
      if (level.candle.low >= currentCandle.close) {
        return false;
      }
      
      for (const l of range) {
        if (l.type === "resistance") {
          if (l.candle.high - level.candle.low < strategyParams!.ranges!.minPriceDifferenceBetweenRangePoints) {
            return false;
          }

          for (let i = level.index+1; i < l.index; i++) {
            if (candles[i].low < level.candle.low) {
              return false;
            }
          }
        } else {
          if (Math.abs(l.candle.low-level.candle.low) > strategyParams!.ranges!.maxPriceDifferenceForSameHorizontalLevel) {
            return false;
          }
        }
      }
    }

    return true;
  }
  
}


export function getAverages(range: RangePoint[]): number[] {
  const resistances = range.filter(l => l.type === "resistance");
  const supports = range.filter(l => l.type === "support");

  let totalResistances = 0;
  let totalSupports = 0;
  resistances.map(s => totalResistances += s.candle.high);
  supports.map(s => totalSupports += s.candle.low);

  return [
    totalResistances / resistances.length,
    totalSupports / supports.length
  ];
}
