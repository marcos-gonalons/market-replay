import { StrategyParams } from "../../../../../services/scriptsExecutioner/Types";
import { Candle } from "../../../../globalContext/Types";
import { Level } from "../GetHorizontalLevel";

interface IsRangeValidParams {
  range: Level[];
  validationParams: StrategyParams["ranges"];
  candles: Candle[];
  currentCandle: Candle;
  currentDataIndex: number;
}
export function isRangeValid({
  range,
  validationParams,
  candles,
  currentCandle,
  currentDataIndex
}: IsRangeValidParams): boolean {
  if (range.length < 2) return false;

  const resistances = range.filter(l => l.type === "resistance");
  const supports = range.filter(l => l.type === "support");

  // Each level of the range must alternate between resistance and support.
  let levelType: "resistance"|"support" = range[0].type;
  for (let i = 1; i < range.length; i++) {
    if (levelType === "resistance" && range[i].type === "resistance") return false;
    if (levelType === "support" && range[i].type === "support") return false;

    levelType = range[i].type;
  }
  ////////////////////////////////////////////////////////////

  // Price of the levels must be close to each other.
  let priceToCompare = resistances[0].candle.high;
  for (const r of resistances) {
    if (Math.abs(priceToCompare-r.candle.high) > validationParams!.maxPriceDifferenceForSameHorizontalLevel) {
      return false;
    }
  }

  priceToCompare = supports[0].candle.low;
  for (const r of supports) {
    if (Math.abs(priceToCompare-r.candle.low) > validationParams!.maxPriceDifferenceForSameHorizontalLevel) {
      return false;
    }
  }
  ////////////////////////////////////////////////////////////

  // Price difference between levels must be high enough.
  levelType = range[0].type;
  let price = levelType === "resistance" ? range[0].candle.high : range[0].candle.low;
  for (let i = 1; i < range.length; i++) {
    let priceToCompare = range[i].type === "resistance" ? range[i].candle.high : range[i].candle.low;
    if (Math.abs(price - priceToCompare) < validationParams!.minPriceDifferenceBetweenRangePoints) {
      return false;
    }

    price = priceToCompare;
  }
  ////////////////////////////////////////////////////////////

  // All candles between levels must not be lower or higher than the level.
  for (let i = 0; i < range.length - 1; i++) {
    let higherIndex = range[i].index-1;
    let lowerIndex = range[i+1].index+1;
    if (higherIndex <= lowerIndex) {
      return false;
    }
    for (let j = higherIndex; j > lowerIndex; j--) {
      if (range[i].type === "resistance") {
        if (candles[j].high > range[i].candle.high) {
          return false;
        }
        if (candles[j].low < range[i+1].candle.low) {
          return false;
        }
      } else {
        if (candles[j].low < range[i].candle.low) {
          return false;
        }
        if (candles[j].high > range[i+1].candle.high) {
          return false;
        }
      }
    }
  }
  ////////////////////////////////////////////////////////////

  // There must be enough candles between each level and not too many
  for (let i = 0; i < range.length - 1; i++) {
    const diff = Math.abs(range[i].index - range[i+1].index);
    if (
      diff < validationParams!.minCandlesBetweenRangePoints ||
      diff > validationParams!.maxCandlesBetweenRangePoints
    ) {
      return false;
    }
  }
  ////////////////////////////////////////////////////////////

  // currentCandle.close must be between the lowest resistance price and the highest support price.
  let lowestResistance = Number.POSITIVE_INFINITY;
  let highestSupport = Number.NEGATIVE_INFINITY;
  for (const l of range) {
    if (l.type === "resistance" && l.candle.high < lowestResistance)
      lowestResistance = l.candle.high

    if (l.type === "support" && l.candle.low > highestSupport)
      highestSupport = l.candle.low;
  }
  if (currentCandle.close > lowestResistance || currentCandle.close < highestSupport) {
    return false;
  }
  ////////////////////////////////////////////////////////////

  // All candles from currentCandle to first candle of the range must be between the lowest resistance price and the highest support price.
  for (let i = range[0].index+1; i < currentDataIndex; i++) {
    if (candles[i].low < highestSupport) return false;
    if (candles[i].high > lowestResistance) return false;
  }
  ////////////////////////////////////////////////////////////

  return true;
}