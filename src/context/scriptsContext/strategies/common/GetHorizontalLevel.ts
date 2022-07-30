import { Candle } from "../../../globalContext/Types";

interface Params {
  readonly resistanceOrSupport: "resistance" | "support";
  readonly currentDataIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel: number;
  readonly priceOffset: number;
  readonly candles: Candle[];
  readonly log: (...msg: any[]) => void;
}

export function get({
  resistanceOrSupport,
  currentDataIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  priceOffset,
  candles,
  log
}: Params): number|null {
  let amount = 100;

  for (let x = currentDataIndex; x > currentDataIndex - amount; x--) {
    const horizontalLevelCandleIndex = x - candlesAmountToBeConsideredHorizontalLevel!;
    if (
      horizontalLevelCandleIndex < 0 ||
      x < candlesAmountToBeConsideredHorizontalLevel! * 2
    ) {
      continue;
    }
    
    let isFalsePositive = false;
    for (let j = horizontalLevelCandleIndex + 1; j < x; j++) {
      if (resistanceOrSupport === "resistance") {
        isFalsePositive = candles[j].high > candles[horizontalLevelCandleIndex].high;
      }
      if (resistanceOrSupport === "support") {
        isFalsePositive = candles[j].low < candles[horizontalLevelCandleIndex].low;
      }
  
      if (isFalsePositive) {
        log("future_overcame");
        break;
      }
  
    }
    
    if (isFalsePositive) continue;
    

    isFalsePositive = false;
    for (
     let j = horizontalLevelCandleIndex - candlesAmountToBeConsideredHorizontalLevel!;
      j < horizontalLevelCandleIndex;
      j++
    ) {
      if (!candles[j]) continue;
  
      if (resistanceOrSupport === "resistance") {
        isFalsePositive = candles[j].high > candles[horizontalLevelCandleIndex].high
      }
      if (resistanceOrSupport === "support") {
        isFalsePositive = candles[j].low < candles[horizontalLevelCandleIndex].low;
      }

      if (isFalsePositive) {
        log("past_overcame");
        break;
      }
    }
    
    if (isFalsePositive) continue;
  
    if (resistanceOrSupport === "support") {
      return candles[horizontalLevelCandleIndex].low + priceOffset!;
    } else {
      return candles[horizontalLevelCandleIndex].high - priceOffset!
    }
  }

  return null;

}
