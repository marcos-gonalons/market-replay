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
    if (longOrShort === "long") {
      let sl = GetHorizontalLevel({ ...p, resistanceOrSupport: "support" });
      if (!sl || sl >= orderPrice) {
        return orderPrice - maxStopLossDistance;
      }
      if (orderPrice - sl >= maxStopLossDistance) {
        return orderPrice - maxStopLossDistance;
      }
      if (orderPrice - sl <= minStopLossDistance) {
        return orderPrice - minStopLossDistance;
      }
      return sl;
    }
    if (longOrShort === "short") {
      let sl = GetHorizontalLevel({ ...p, resistanceOrSupport: "resistance" });
      if (!sl || sl <= orderPrice) {
        return orderPrice + maxStopLossDistance;
      }
      if (sl - orderPrice >= maxStopLossDistance) {
        return orderPrice + maxStopLossDistance;
      }
      if (sl - orderPrice <= minStopLossDistance) {
        return orderPrice + minStopLossDistance;
      }
      return sl;
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