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
  readonly candlesToCheck: number;
  readonly log?: (...msg: any[]) => void;
}

export function get({
  resistanceOrSupport,
  currentDataIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  priceOffset,
  candles,
  candlesToCheck
}: GetParams): number[] {
  for (let x = currentDataIndex; x > currentDataIndex - candlesToCheck; x--) {
    if (x < 0) {
      break;
    }

    const isValid = IsValidHorizontalLevel({
      resistanceOrSupport,
      indexToCheck: x,
      candlesAmountToBeConsideredHorizontalLevel,
      candles,
      currentDataIndex
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
  readonly currentDataIndex: number;
}
export function IsValidHorizontalLevel({
  resistanceOrSupport,
  indexToCheck,
  candlesAmountToBeConsideredHorizontalLevel,
  candles,
  currentDataIndex
 }: IsValidHorizontalLevelParams): boolean {
  if (indexToCheck >= currentDataIndex || indexToCheck < 0) return false;

  // Future candles
  for (let i = indexToCheck+1; i < indexToCheck+1+candlesAmountToBeConsideredHorizontalLevel.future; i++) {
    if (i === currentDataIndex) return false;
    if (resistanceOrSupport === "resistance")
      if (candles[i].high > candles[indexToCheck].high) return false;

    if (resistanceOrSupport === "support")
      if (candles[i].low < candles[indexToCheck].low) return false;
  }

  // Past candles
  for (let i = indexToCheck-candlesAmountToBeConsideredHorizontalLevel.past; i < indexToCheck; i++) {
    if (i < 0) return false;
    if (resistanceOrSupport === "resistance")
      if (candles[i].high > candles[indexToCheck].high) return false;
      
    if (resistanceOrSupport === "support")
      if (candles[i].low < candles[indexToCheck].low) return false;
  }

  return true;
}