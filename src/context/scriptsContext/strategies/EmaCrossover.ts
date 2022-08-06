import { StrategyFuncParameters } from "../../../services/scriptsExecutioner/Types";

import type { Candle, MovingAverage } from "../../globalContext/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";
import { get as GetHorizontalLevel } from "./common/GetHorizontalLevel";

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

  if (openPosition && openPosition.position === "long") {
    if (
      params!.tpDistanceShortForTighterSL !== 0 && 
      candles[currentDataIndex].timestamp > openPosition.createdAt! &&
      openPosition.takeProfit! - candles[currentDataIndex].high < params!.tpDistanceShortForTighterSL!
    ) {
      debugLog(
        ENABLE_DEBUG,
        "Adjusting SL ...",
        date,
        openPosition,
        candles[currentDataIndex],
        params!.tpDistanceShortForTighterSL
      );
      const newSL = openPosition.price + params!.slDistanceWhenTpIsVeryClose!;
      if (newSL < candles[currentDataIndex].close) {
        debugLog(ENABLE_DEBUG, "Adjusted SL", date, newSL);
        openPosition.stopLoss = newSL;
      } else {
        debugLog(ENABLE_DEBUG, "Can't adjust the SL, is higher than current price", date, newSL, candles[currentDataIndex]);
      }
    }
  }

  if (openPosition && openPosition.position === "short") {
    if (
      params!.tpDistanceShortForTighterSL !== 0 && 
      candles[currentDataIndex].timestamp > openPosition.createdAt! &&
      candles[currentDataIndex].low - openPosition.takeProfit! < params!.tpDistanceShortForTighterSL!
    ) {
      debugLog(
        ENABLE_DEBUG,
        "Adjusting SL ...",
        date,
        openPosition,
        candles[currentDataIndex],
        params!.tpDistanceShortForTighterSL
      );
      const newSL = openPosition.price - params!.slDistanceWhenTpIsVeryClose!;
      if (newSL > candles[currentDataIndex].close) {
        debugLog(ENABLE_DEBUG, "Adjusted SL", date, newSL);
        openPosition.stopLoss = newSL;
      } else {
        debugLog(ENABLE_DEBUG, "Can't adjust the SL, is lower than current price", date, newSL, candles[currentDataIndex]);
      }
    }
  }

  if (openPosition) {
    debugLog(ENABLE_DEBUG, "There is an open position - doing nothing ...", date, openPosition);
    return;
  }

  const baseEMA = 200;
  const smallEMA = 9;
  const bigEMA = 21;

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
      maxStopLossDistance: params!.stopLossDistance,
      minStopLossDistance: params!.minStopLossDistance!,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: params!.priceOffset!,
      candles,
      currentDataIndex,
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });

    const takeProfit = price + params!.takeProfitDistance;
    // const size = Math.floor((balance * (params!.riskPercentage / 100)) / (params!.stopLossDistance * 10000 * 0.85)) * 10000 || 10000;
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
      maxStopLossDistance: params!.stopLossDistance,
      minStopLossDistance: params!.minStopLossDistance!,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: params!.priceOffset!,
      candles,
      currentDataIndex,
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });

    const takeProfit = price - params!.takeProfitDistance;
    // const size = Math.floor((balance * (params!.riskPercentage / 100)) / (params!.stopLossDistance * 10000 * 0.85)) * 10000 || 10000;
    const size = 10000;
    const rollover = (90 * size) / 10000;
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
  readonly maxStopLossDistance: number;
  readonly minStopLossDistance: number;
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
  maxStopLossDistance,
  minStopLossDistance,
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
      debugger;
      let sl = GetHorizontalLevel({ ...p, resistanceOrSupport: "support" });
      if (!sl || sl >= orderPrice) {
        return orderPrice - maxStopLossDistance;
      }
      if (orderPrice - sl > minStopLossDistance) {
        return orderPrice - minStopLossDistance;
      }
      return sl;
    }
    if (longOrShort === "short") {
      let sl = GetHorizontalLevel({ ...p, resistanceOrSupport: "resistance" });
      if (!sl || sl <= orderPrice) {
        return orderPrice + maxStopLossDistance;
      }
      if (sl - orderPrice > minStopLossDistance) {
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