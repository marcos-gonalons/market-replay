import { StrategyParams } from "../../../../../services/scriptsExecutioner/Types";
import { Candle } from "../../../../globalContext/Types";
import { get as GetHorizontalLevel, Level } from "../GetHorizontalLevel";
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
  let previousPotentialLevels: any = [];

  while (currentRangePoint <= strategyParams!.ranges!.rangePoints) {
    [level, previousPotentialLevels] = getPreviousValidRangeLevel(1, index, previousPotentialLevels);
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

  function getPreviousValidRangeLevel(attempt: number, startAt: number, previousPotentialLevels: Level[]): any {
    let indexToUse = startAt;
    let potentialRangeLevels = [];
    for (let i = 0; i < 10; i++) {
      const potentialLevel = GetHorizontalLevel({
        resistanceOrSupport: levelToGet,
        startAtIndex: indexToUse,
        maxIndex: currentDataIndex,
        candlesAmountToBeConsideredHorizontalLevel: strategyParams!.candlesAmountToBeConsideredHorizontalLevel!,
        candles,
        candlesToCheck
      });
    
      if (!potentialLevel) {
        continue;
      }
    
      potentialRangeLevels.push(potentialLevel);

      indexToUse = potentialLevel.index - 1;
    }

    for (const potentialRangeLevel of potentialRangeLevels) {
      if (!validateRangeLevel(potentialRangeLevel, range, candles)) {
        continue;
      }
      
      return [potentialRangeLevel, potentialRangeLevels];
    }

    // None of the potential levels was valid. So let's recheck again with the next potential level from the previous iteration.
    const previousPotentialLevel = previousPotentialLevels[attempt] ?? null;
    if (!previousPotentialLevel) {
      return [null, []];
    }
    range.pop();
    range.push(previousPotentialLevel);

    return getPreviousValidRangeLevel(attempt+1, previousPotentialLevel.index-1, previousPotentialLevels);
  }

  function validateRangeLevel(level: Level, range: Level[], candles: Candle[]): boolean {
    if (range.length === 0) return true;

    return isRangeValid({
      range: [...range, level],
      validationParams: strategyParams!.ranges!,
      candles,
      currentCandle
    });
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
