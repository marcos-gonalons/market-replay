import { Candle } from "../../../globalContext/Types";

interface GetParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly startAtIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  };
  readonly candles: Candle[];
  readonly candlesToCheck: number;
  readonly maxIndex: number;
}

export type Level = {
  candle: Candle;
  index: number;
  type: "resistance" | "support" 
};

export function get({
  resistanceOrSupport,
  startAtIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
  candlesToCheck,
  maxIndex
}: GetParams): Level | null {
  for (let x = startAtIndex; x > startAtIndex - candlesToCheck; x--) {
    if (x < 0) {
      break;
    }

    const isValid = IsValidHorizontalLevel({
      resistanceOrSupport,
      indexToCheck: x,
      candlesAmountToBeConsideredHorizontalLevel,
      candles,
      maxIndex
    });
    if (!isValid) continue;

    return { type: resistanceOrSupport, index: x, candle: candles[x] };
  }

  return null;
}

interface IsValidHorizontalLevelParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly indexToCheck: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  }
  readonly candles: Candle[];
  readonly maxIndex: number;
}
export function IsValidHorizontalLevel({
  resistanceOrSupport,
  indexToCheck,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
  maxIndex
 }: IsValidHorizontalLevelParams): boolean {
  if (indexToCheck >= maxIndex || indexToCheck < 0) {
    return false;
  }

  // Future candles
  for (let i = indexToCheck+1; i < indexToCheck+1+candlesAmountToBeConsideredHorizontalLevel.future; i++) {
    if (i === maxIndex) {
      return false;
    }
    if (resistanceOrSupport === "resistance") {
      if (candles[i].high > candles[indexToCheck].high) {
        return false;
      }
    }

    if (resistanceOrSupport === "support") {
      if (candles[i].low < candles[indexToCheck].low) {
        return false;
      }
    }
  }
  
  // Past candles
  for (let i = indexToCheck-candlesAmountToBeConsideredHorizontalLevel.past; i < indexToCheck; i++) {
    if (i < 0) {
      return false;
    }
    if (resistanceOrSupport === "resistance") {
      if (candles[i].high > candles[indexToCheck].high) {
        return false;
      }
    }
      
    if (resistanceOrSupport === "support") {
      if (candles[i].low < candles[indexToCheck].low) {
        return false;
      }
    }
  }

  return true;
}