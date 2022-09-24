import { StrategyFuncParameters } from "../../../services/scriptsExecutioner/Types";

import type { Candle, MovingAverage } from "../../globalContext/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";
import { get as GetHorizontalLevel } from "./common/GetHorizontalLevel";
import { handle as HandleTrailingSLAndTP } from "./common/HandleTrailingSLAndTP";

export function Strategy({
  candles,
  orders,
  trades,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
  debugLog,
}: StrategyFuncParameters) {
  const ENABLE_DEBUG = false;

  const baseEMA = 200;
  const smallEMA = 9;
  const bigEMA = 21;

  void persistedVars;
  void trades;
  void spread;
  void createOrder;

  debugLog(ENABLE_DEBUG, "Params ", params);
  const currentCandle = candles[currentDataIndex];
  const date = new Date(currentCandle.timestamp);

  if (!isWithinTime([], [], params!.validMonths || [], date) || !isWithinTime([], params!.validDays || [], [], date)) {
    return;
  }
  const isValidTime = isWithinTime(params!.validHours || [], params!.validDays || [], params!.validMonths || [], date);
  void isValidTime;

  if (balance < 0) {
    balance = 1;
  }
  if (candles.length <= 1 || currentDataIndex === 0) return;

  const openPosition = orders.find((o) => o.type === "market");

  if (openPosition && params!.maxSecondsOpenTrade) {
    const diffInSeconds = Math.floor((date.valueOf() - openPosition.createdAt!.valueOf()) / 1000);

    if (diffInSeconds >= params!.maxSecondsOpenTrade) {
      debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, openPosition);
      closeOrder(openPosition.id!);
    }
  }

  HandleTrailingSLAndTP({
    openPosition,
    trailingSL: params!.trailingSL!,
    trailingTP: params!.trailingTP!,
    currentCandle: candles[currentDataIndex],
    log: (...msg: any[]) => {
      debugLog(ENABLE_DEBUG, date, ...msg)
    }
  });

  if (openPosition) {
    if (openPosition.position === "long") {
      if (currentCandle.open - openPosition.price > params!.minProfit!) {
        if (getEMA(candles[currentDataIndex-1], smallEMA).value < getEMA(candles[currentDataIndex-1], bigEMA).value) {
          closeOrder(openPosition.id!, 'open');
          return;
        }
      }
    }

    if (openPosition.position === "short") {
      alert('TODO!');
    }
  }

  if (openPosition) {
    debugLog(ENABLE_DEBUG, "There is an open position - doing nothing ...", date, openPosition);
    return;
  }

  if (currentCandle.open > getEMA(currentCandle, baseEMA).value) {
    debugLog(ENABLE_DEBUG, "Price is above huge EMA, only longs allowed", currentCandle, date);

    for (let i = currentDataIndex - params!.candlesAmountWithoutEMAsCrossing! - 2; i <= currentDataIndex - 2; i++) {
      if (i <= 0) return;

      if (getEMA(candles[i], smallEMA).value >= getEMA(candles[i], bigEMA).value) {
        debugLog(ENABLE_DEBUG, "Small EMA was above the big EMA very recently - doing nothing", currentCandle, date);
        return;
      }
    }

    if (getEMA(candles[currentDataIndex-1], smallEMA).value < getEMA(candles[currentDataIndex-1], bigEMA).value) {
      debugLog(ENABLE_DEBUG, "Small EMA is still below the big EMA - doing nothing", currentCandle, date);
      return;
    }

    const price = currentCandle.open;

    const stopLoss = getStopLoss({
      longOrShort: "long",
      orderPrice: price,
      minStopLossDistance: params!.minStopLossDistance!,
      maxStopLossDistance: params!.maxStopLossDistance!,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: params!.priceOffset!,
      candles,
      currentDataIndex,
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });

    const takeProfit = price + params!.takeProfitDistance!!;
    // const size = Math.floor((balance * (params!.riskPercentage / 100)) / (params!.stopLossDistance! * 10000 * 0.85)) * 10000 || 10000;
    const size = 10000;
    const rollover = (0.7 * size) / 10000;
    const o: Order = {
      type: "market" as OrderType,
      position: "long" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
      rollover,
      createdAt: currentCandle.timestamp,
      fillDate: currentCandle.timestamp
    };

    createOrder(o);
    debugLog(ENABLE_DEBUG, "Trade executed", date, o);
  }
  

  if (currentCandle.open < getEMA(currentCandle, baseEMA).value) {
    return;
    debugLog(ENABLE_DEBUG, "Price is below 200 EMA, only shorts allowed", currentCandle, date);

    for (let i = currentDataIndex - params!.candlesAmountWithoutEMAsCrossing! - 2; i <= currentDataIndex - 2; i++) {
      if (i <= 0) return;

      if (getEMA(candles[i], smallEMA).value <= getEMA(candles[i], bigEMA).value) {
        debugLog(ENABLE_DEBUG, "Small EMA was below the big EMA very recently - doing nothing", currentCandle, date);
        return;
      }
    }

    if (getEMA(candles[currentDataIndex-1], smallEMA).value > getEMA(candles[currentDataIndex-1], bigEMA).value) {
      debugLog(ENABLE_DEBUG, "Small EMA is still above the big EMA - doing nothing", currentCandle, date);
      return;
    }

    const price = currentCandle.open;

    const stopLoss = getStopLoss({
      longOrShort: "short",
      orderPrice: price,
      minStopLossDistance: params!.minStopLossDistance!,
      maxStopLossDistance: params!.maxStopLossDistance!,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: params!.priceOffset!,
      candles,
      currentDataIndex,
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });

    const takeProfit = price - params!.takeProfitDistance!!;
    // const size = Math.floor((balance * (params!.riskPercentage / 100)) / (params!.stopLossDistance! * 10000 * 0.85)) * 10000 || 10000;
    const size = 10000;
    const rollover = (0.7 * size) / 10000;
    const o: Order = {
      type: "market" as OrderType,
      position: "short" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
      rollover,
      createdAt: currentCandle.timestamp,
      fillDate: currentCandle.timestamp
    };

    createOrder(o);
    debugLog(ENABLE_DEBUG, "Trade executed", date, o);
  }

}


function getEMA(candle: Candle, candlesAmount: number): MovingAverage {
  return candle.indicators.movingAverages.find(m => m.candlesAmount === candlesAmount)!;
}

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
function getStopLoss({
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