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

    const { isValid, indexFound } = IsValidHorizontalLevel({
      resistanceOrSupport,
      currentCandlesIndex: x,
      candlesAmountToBeConsideredHorizontalLevel,
      candles
    });
    if (!isValid) continue;
  
    if (resistanceOrSupport === "support") {
      return [candles[indexFound].low + priceOffset!, indexFound];
    } else {
      return [candles[indexFound].high - priceOffset!, indexFound];
    }
  }

  return [0,0];
}

interface IsValidHorizontalLevelParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly currentCandlesIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  }
  readonly candles: Candle[];
}
export function IsValidHorizontalLevel({
  resistanceOrSupport,
  currentCandlesIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
 }: IsValidHorizontalLevelParams): { isValid: boolean, indexFound: number } {
  const indexToCheck = currentCandlesIndex - candlesAmountToBeConsideredHorizontalLevel.future
  if (indexToCheck < 0 || currentCandlesIndex < candlesAmountToBeConsideredHorizontalLevel.future + candlesAmountToBeConsideredHorizontalLevel.past) {
    return { isValid: false, indexFound: 0 };
  }
  
  let isFalsePositive = false;
  for (let j = indexToCheck + 1; j < currentCandlesIndex; j++) {
    if (resistanceOrSupport === "resistance") {
      isFalsePositive = candles[j].high > candles[indexToCheck].high;
    }
    if (resistanceOrSupport === "support") {
      isFalsePositive = candles[j].low < candles[indexToCheck].low;
    }

    if (isFalsePositive) return { isValid: false, indexFound: 0 };
  }

  isFalsePositive = false;
  for (
    let j = indexToCheck - candlesAmountToBeConsideredHorizontalLevel.past;
    j < indexToCheck;
    j++
  ) {
    if (!candles[j]) return { isValid: false, indexFound: 0 };

    if (resistanceOrSupport === "resistance") {
      isFalsePositive = candles[j].high > candles[indexToCheck].high
    }
    if (resistanceOrSupport === "support") {
      isFalsePositive = candles[j].low < candles[indexToCheck].low;
    }

    if (isFalsePositive) return { isValid: false, indexFound: 0 };
  }
  
  return { isValid: true, indexFound: indexToCheck };
}