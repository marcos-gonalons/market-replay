import { Candle } from "../../../globalContext/Types";

interface GetParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly currentDataIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  };
  readonly priceOffset: number;
  readonly candles: Candle[];
  readonly log: (...msg: any[]) => void;
}

export function get({
  resistanceOrSupport,
  currentDataIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  priceOffset,
  candles
}: GetParams): number[] {
  let candlesToCheck = 300;

  for (let x = currentDataIndex; x > currentDataIndex - candlesToCheck; x--) {
    if (x < 0) {
      break;
    }
    const horizontalLevelCandleIndex = x - candlesAmountToBeConsideredHorizontalLevel.future;

    if (!IsValidHorizontalLevel({
      resistanceOrSupport,
      currentCandlesIndex: x,
      indexToCheck: horizontalLevelCandleIndex,
      candlesAmountToBeConsideredHorizontalLevel,
      candles
    })) {
      continue;
    }
  
    if (resistanceOrSupport === "support") {
      return [candles[horizontalLevelCandleIndex].low + priceOffset!, horizontalLevelCandleIndex];
    } else {
      return [candles[horizontalLevelCandleIndex].high - priceOffset!, horizontalLevelCandleIndex];
    }
  }

  return [0,0];
}

interface IsValidHorizontalLevelParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly indexToCheck: number;
  readonly currentCandlesIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  }
  readonly candles: Candle[];
}
export function IsValidHorizontalLevel({
  resistanceOrSupport,
  indexToCheck,
  currentCandlesIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
 }: IsValidHorizontalLevelParams): boolean {
    if (indexToCheck < 0 || currentCandlesIndex < candlesAmountToBeConsideredHorizontalLevel.future + candlesAmountToBeConsideredHorizontalLevel.past) {
      return false;
    }
    
    let isFalsePositive = false;
    for (let j = indexToCheck + 1; j < currentCandlesIndex; j++) {
      if (resistanceOrSupport === "resistance") {
        isFalsePositive = candles[j].high > candles[indexToCheck].high;
      }
      if (resistanceOrSupport === "support") {
        isFalsePositive = candles[j].low < candles[indexToCheck].low;
      }
  
      if (isFalsePositive) return false;
    }

    isFalsePositive = false;
    for (
     let j = indexToCheck - candlesAmountToBeConsideredHorizontalLevel.past;
      j < indexToCheck;
      j++
    ) {
      if (!candles[j]) return false;
  
      if (resistanceOrSupport === "resistance") {
        isFalsePositive = candles[j].high > candles[indexToCheck].high
      }
      if (resistanceOrSupport === "support") {
        isFalsePositive = candles[j].low < candles[indexToCheck].low;
      }

      if (isFalsePositive) return false;
    }
    
    return true;
}