import { Candle } from "../../../globalContext/Types";

import { get as GetHorizontalLevel } from "./GetHorizontalLevel";


interface GetStopLossParams {
  readonly orderPrice: number;
  readonly minStopLossDistance: number;
  readonly maxStopLossDistance: number;
  readonly currentDataIndex: number;
  readonly candlesAmountToBeConsideredHorizontalLevel?: {
    readonly future: number;
    readonly past: number;
  };
  readonly longOrShort: "long" | "short";
  readonly priceOffset: number;
  readonly candles: Candle[];
  readonly maxAttempts: number;
  readonly log: (...msg: any[]) => void;
}


export function get({
  orderPrice,
  minStopLossDistance,
  maxStopLossDistance,
  currentDataIndex,
  candlesAmountToBeConsideredHorizontalLevel,
  longOrShort,
  candles,
  priceOffset,
  maxAttempts,
  log
}: GetStopLossParams): number {
  if (candlesAmountToBeConsideredHorizontalLevel) {
    const p = {
      currentDataIndex,
      candlesAmountToBeConsideredHorizontalLevel,
      priceOffset,
      candles,
      log
    };
    let sl: number | null = null;
    let index = currentDataIndex;
    let attempt = 0;

    while (true) {
      const level = GetHorizontalLevel({
        ...p,
        candlesToCheck: 300,
        startAtIndex: index,
        maxIndex: currentDataIndex,
        resistanceOrSupport: longOrShort === "long" ? "support" : "resistance"
      });
      if (!level) {
        break;
      }

      sl = level.type === "resistance" ? level.candle.high : level.candle.low;

      if (longOrShort === "long") {
        sl = sl + priceOffset;
      }
      if (longOrShort === "short") {
        sl = sl - priceOffset;
      }

      const validSL = longOrShort === "long" ?
        !((!sl || sl >= orderPrice) || (orderPrice - sl >= maxStopLossDistance) || (orderPrice - sl <= minStopLossDistance))
        :
        !((!sl || sl <= orderPrice) || (sl - orderPrice >= maxStopLossDistance) || (sl - orderPrice <= minStopLossDistance));
      
      log("SL is " + sl);
      if (validSL) {
        break;
      }
      log("Invalid SL - Trying again ... ");
      index = level?.index-1;
      attempt++;

      if (attempt === maxAttempts) {
        log("Max attempts reached - Unable to find a proper stop loss");
        sl = null;
        break;
      }
    }

    if (longOrShort === "long") {
      return sl ? sl : orderPrice - maxStopLossDistance;
    } else {
      return sl ? sl : orderPrice + maxStopLossDistance;
    }

  } else { 
    if (longOrShort === "long") {
      return orderPrice - maxStopLossDistance;
    }
    if (longOrShort === "short") {
      return orderPrice + maxStopLossDistance;
    }
  }
  return 0;
}
