import { StrategyParams } from "../../../../services/scriptsExecutioner/Types";
import { Candle } from "../../../globalContext/Types";
import { get as GetHorizontalLevel, Level } from "./GetHorizontalLevel";
import { isRangeValid } from "./RangeValidator";


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
}: GetRangeParams): Level[] | null {
  let currentRangePoint = 1;
  let levelToGet = strategyParams!.ranges!.startWith;
  let index = currentDataIndex;
  let candlesToCheck = strategyParams!.ranges!.candlesToCheck;
  const range: Level[] = [];
  let level: any;
  let previous: any = [];
  while (currentRangePoint <= strategyParams!.ranges!.rangePoints) {
    [level, previous] = getPreviousValidRangeLevel(1, index, previous);
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

  debugger;
  if (!isRangeValid({
    range,
    validationParams: strategyParams!.ranges!,
    candles,
    currentCandle
  })) return null;

  return range;

  function getPreviousValidRangeLevel(attempt: number, startAt: number, previousPotentialLevels: Level[]): any {
    let indexToUse = startAt;
    let potentialRangeLevels = [];
    for (let i = 0; i < 10; i++) {
      const _level = GetHorizontalLevel({
        resistanceOrSupport: levelToGet,
        startAtIndex: indexToUse,
        candlesAmountToBeConsideredHorizontalLevel: strategyParams!.candlesAmountToBeConsideredHorizontalLevel!,
        candles,
        candlesToCheck
      });
    
      if (!_level) {
        continue;
      }
    
      potentialRangeLevels.push(_level);

      indexToUse = _level.index - 1;
    }

    for (const potentialRangeLevel of potentialRangeLevels) {
      if (!validateRangeLevel(potentialRangeLevel, range, candles)) {
        continue;
      }
      
      return [potentialRangeLevel, potentialRangeLevels];
    }

    const toCheck = previousPotentialLevels[attempt] ?? null;
    if (!toCheck) {
      return [null, []];
    }
    range.pop();
    range.push(toCheck);

    return getPreviousValidRangeLevel(attempt+1, toCheck.index-1, previousPotentialLevels);
  }

  function validateRangeLevel(level: Level, range: Level[], candles: Candle[]): boolean {
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


export function getAverages(range: Level[]): number[] {
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


/*
export function v2({
  candles,
  currentCandle,
  currentDataIndex,
  strategyParams
}: GetRangeParams): Level[] | null {
  void currentCandle;

  const get = (resistanceOrSupport: "resistance"|"support"): Level[] => {
    return getLastLevels({
      resistanceOrSupport,
      amount: 10,
      startAtIndex: currentDataIndex,
      candlesAmountToBeConsideredHorizontalLevel: strategyParams.candlesAmountToBeConsideredHorizontalLevel!,
      candles,
      candlesToCheck: strategyParams.ranges!.candlesToCheck
    });
  }

  const resistances = get("resistance");
  const supports = get("support");

  // construir un rango de N puntos
  // validarlo
  // no? siguiente rango
  for (const [index, resistance] of resistances.entries()) {
    
  }

  return null;
}
*/


/*
interface GetLastLevelsParams {
  resistanceOrSupport: "resistance"|"support";
  amount: number;
  startAtIndex: number;
  candlesAmountToBeConsideredHorizontalLevel: CandlesAmountToBeConsideredHorizontalLevel;
  candles: Candle[];
  candlesToCheck: number;
}
function getLastLevels({
  resistanceOrSupport,
  amount,
  startAtIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
  candlesToCheck
}: GetLastLevelsParams): Level[] {
  const levels: Level[] = [];
  let index = startAtIndex;
  for (let i = 0; i < amount; i++) {
      const level = GetHorizontalLevel({
          resistanceOrSupport,
          startAtIndex,
          candlesAmountToBeConsideredHorizontalLevel,
          candles,
          candlesToCheck
        });

      if (!level) break;

      levels.push(level);
      index = level.index - 1;
  }

  return levels;
}
*/