import { Candle } from "../../../globalContext/Types";

interface GetParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly startAtIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  };
  readonly priceOffset: number;
  readonly candles: Candle[];
  readonly candlesToCheck: number;
  readonly log?: (...msg: any[]) => void;
}

export function get({
  resistanceOrSupport,
  startAtIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  priceOffset,
  candles,
  candlesToCheck
}: GetParams): number[] {
  for (let x = startAtIndex; x > startAtIndex - candlesToCheck; x--) {
    if (x < 0) {
      break;
    }

    const isValid = IsValidHorizontalLevel({
      resistanceOrSupport,
      indexToCheck: x,
      candlesAmountToBeConsideredHorizontalLevel,
      candles,
      startAtIndex
    });
    if (!isValid) continue;

    if (resistanceOrSupport === "support") {
      return [candles[x].low + priceOffset!, x];
    } else {
      return [candles[x].high - priceOffset!, x];
    }
  }

  return [0,0];
}

interface IsValidHorizontalLevelParams {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly indexToCheck: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: {
    readonly future: number;
    readonly past: number;
  }
  readonly candles: Candle[];
  readonly startAtIndex: number;
}
export function IsValidHorizontalLevel({
  resistanceOrSupport,
  indexToCheck,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
  startAtIndex
 }: IsValidHorizontalLevelParams): boolean {
  if (indexToCheck >= startAtIndex || indexToCheck < 0) {
    return false;
  }

  // Future candles
  for (let i = indexToCheck+1; i < indexToCheck+1+candlesAmountToBeConsideredHorizontalLevel.future; i++) {
    if (i === startAtIndex) {
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