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
    const level = getPreviousValidRangeLevel(1, index);
    if (!level) {
      break;
    }

    index = level.index-strategyParams!.ranges!.minCandlesBetweenRangePoints;
    candlesToCheck = strategyParams!.ranges!.maxCandlesBetweenRangePoints;
    currentRangePoint++;

    levelToGet = levelToGet === "support" ? "resistance" : "support";
    
    range.push(level);
  }

  if (currentRangePoint <= strategyParams!.ranges!.rangePoints) {
    return null;
  }

  return range;

  function getPreviousValidRangeLevel(attempt: number, startAt: number): RangePoint | null {
    let maxAttempts = 10;
    if (attempt === maxAttempts) {
      return null;
    }

    /**
     * volver a debuguear el rango del 18 de noviembre a 30 de noviembre.
     */
  
    let [_, foundAt] = GetHorizontalLevel({
      resistanceOrSupport: levelToGet,
      startAtIndex: startAt,
      candlesAmountToBeConsideredHorizontalLevel: strategyParams!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: 0,
      candles,
      candlesToCheck
    });
    void _;
  
    if (!foundAt) {
      return null;
    }
  
    const level = { type: levelToGet, index: foundAt, candle: candles[foundAt] };
    if (!validateRangeLevel(level, range, candles)) {
      return getPreviousValidRangeLevel(attempt+1, foundAt-1);
    }
  
    return level;
  }

  function validateRangeLevel(level: RangePoint, range: Range, candles: Candle[]): boolean {
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

    if (range.length > 0) {
      const lastLevel = range[range.length-1];
      if (level.type === "support") {
        for (let i = level.index+1; i < lastLevel.index-1; i++) {
          if (candles[i].low < level.candle.low || candles[i].high > lastLevel.candle.high) {
            return false;
          }
        }
      }
      if (level.type === "resistance") {
        for (let i = level.index+1; i < lastLevel.index-1; i++) {
          if (candles[i].high > level.candle.high || candles[i].low < lastLevel.candle.low) {
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



