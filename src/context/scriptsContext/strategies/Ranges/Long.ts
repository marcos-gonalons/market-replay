import { StrategyFuncParameters } from "../../../../services/scriptsExecutioner/Types";
import { Candle } from "../../../globalContext/Types";
import { get as GetHorizontalLevel } from "../common/GetHorizontalLevel";

import { handle as HandleTrailingSLAndTP } from "../common/HandleTrailingSLAndTP";

type Level = { candle: Candle; index: number; type: "resistance" | "support" };

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
  const ENABLE_DEBUG = true;

  void persistedVars;
  void trades;
  void spread;
  void createOrder;

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

  if (openPosition?.position === "long") {
    HandleTrailingSLAndTP({
      openPosition,
      trailingSL: params!.trailingSL!,
      trailingTP: params!.trailingTP!,
      currentCandle: candles[currentDataIndex],
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });
  }

  if (openPosition) {
    debugLog(ENABLE_DEBUG, "There is an open position - doing nothing ...", date, openPosition);
    return;
  }


  let currentRangePoint = 1;
  let levelToGet = params!.ranges!.startWith;
  let index = currentDataIndex;
  let candlesToCheck = params!.ranges!.candlesToCheck;
  const levels: Level[] = [];
  while (currentRangePoint <= params!.ranges!.rangePoints) {
    const [_, foundAt] = GetHorizontalLevel({
      resistanceOrSupport: levelToGet,
      currentDataIndex: index,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      priceOffset: 0,
      candles,
      candlesToCheck
    });
    void _;

    if (!foundAt) {
      break;
    }

    const level = { type: levelToGet, index: foundAt, candle: candles[foundAt] };

    if (!validateRangeLevel(level, levels)) {
      break;
    }

    levels.push(level);

    index = foundAt-params!.ranges!.minCandlesBetweenRangePoints;
    candlesToCheck = params!.ranges!.maxCandlesBetweenRangePoints;
    currentRangePoint++;

    levelToGet = levelToGet === "support" ? "resistance" : "support";
  }

  if (currentRangePoint <= params!.ranges!.rangePoints) {
    return;
  }

  debugLog(ENABLE_DEBUG, "HABEMUS RANGE!");
  levels.map(l => l.candle.meta = { type: l.type });

  function validateRangeLevel(level: Level, levels: Level[]): boolean {
    if (level.type === "resistance") {
      if (level.candle.high <= currentCandle.close) {
        return false;
      }

      for (const l of levels) {
        if (l.type === "support") {
          if (level.candle.high - l.candle.low < params!.ranges!.minPriceDifferenceBetweenRangePoints) {
            return false;
          }

          for (let i = level.index+1; i < l.index; i++) {
            if (candles[i].high > level.candle.high) {
              return false;
            }
          }
        } else {
          if (Math.abs(l.candle.high-level.candle.high) > params!.ranges!.maxPriceDifferenceForSameHorizontalLevel) {
            return false;
          }
        }
      }
    }
    if (level.type === "support") {
      if (level.candle.low >= currentCandle.close) {
        return false;
      }
      
      for (const l of levels) {
        if (l.type === "resistance") {
          if (l.candle.high - level.candle.low < params!.ranges!.minPriceDifferenceBetweenRangePoints) {
            return false;
          }

          for (let i = level.index+1; i < l.index; i++) {
            if (candles[i].low < level.candle.low) {
              return false;
            }
          }
        } else {
          if (Math.abs(l.candle.low-level.candle.low) > params!.ranges!.maxPriceDifferenceForSameHorizontalLevel) {
            return false;
          }
        }
      }
    }

    return true;
  }

}
