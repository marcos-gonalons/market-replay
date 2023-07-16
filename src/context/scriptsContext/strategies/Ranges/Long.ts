import { StrategyFuncParameters } from "../../../../services/scriptsExecutioner/Types";
import { Candle } from "../../../globalContext/Types";
import { IsValidHorizontalLevel } from "../common/GetHorizontalLevel";

import { handle as HandleTrailingSLAndTP } from "../common/HandleTrailingSLAndTP";

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

  let candlesToCheck = 300;

  for (let x = currentDataIndex; x > currentDataIndex - candlesToCheck; x--) {
    if (x < 0) {
      break;
    }

    const isValid = IsValidHorizontalLevel({
      resistanceOrSupport: "resistance",
      indexToCheck: x,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      candles
    });
    if (!isValid) continue;

    const resistanceCandle1 = candles[x];
    if (resistanceCandle1.high <= candles[candles.length-1].close) {
      continue;
    }

    debugLog(ENABLE_DEBUG, "resistanceCandle1", resistanceCandle1.timestamp, new Date(resistanceCandle1.timestamp));
    if (resistanceCandle1.timestamp === 1646107200000) {
      debugger;
    }

    // todo: if we start with a support this for must be adjusted
    let isRangeBroken = false;
    for (let k = x+1; k < candles.length-1; k++) {
      if (candles[k].high > resistanceCandle1.high) {
        isRangeBroken = true;
        break;
      }
    }
    if (isRangeBroken) continue;

    const PRICE_TOLERANCE_SAME_LEVEL = 50*(1/10000);

    const { level: supportCandle1, index: supportCandleIndex } = getPreviousLevel(
      "support",
      x,
      candles,
      resistanceCandle1
    );
    if (!supportCandle1) {
      continue;
    }

    const { level: resistanceCandle2 } = getPreviousLevel(
      "resistance",
      supportCandleIndex,
      candles,
      supportCandle1
    );
    if (!resistanceCandle2) {
      continue;
    }

    if (Math.abs(resistanceCandle1.high-resistanceCandle2.high)>=PRICE_TOLERANCE_SAME_LEVEL) {
      continue;
    }

    resistanceCandle1.meta = { marked: "yellow" };
    supportCandle1.meta = { marked: "purple" };
    resistanceCandle2.meta = { marked: "blue" };

    debugLog(ENABLE_DEBUG, "HABEMUS RANGE");
    break;
  }

  function getPreviousLevel(
    resistanceOrSupport: "resistance"|"support",
    currentLevelIndex: number,
    candles: Candle[],
    nextLevelToCompare: Candle,
  ): { level: Candle|null, index: number } {
    const MIN_CANDLES_BETWEEN_LEVELS = 4;
    const MAX_AMOUNT_FOR_NEXT_LEVEL = 500;
    const MIN_PRICE_DIFFERENCE_BETWEEN_LEVELS = 100 * (1/10000);

    const nullReturn = { level: null, index: 0 };

    for (let i = currentLevelIndex-1; i >= currentLevelIndex-1-MIN_CANDLES_BETWEEN_LEVELS; i--) {
      if (resistanceOrSupport === "resistance") {
        if (candles[i].low <= nextLevelToCompare.low) {
          return nullReturn;
        }
      }
      if (resistanceOrSupport === "support") {
        if (candles[i].high >= nextLevelToCompare.high) {
          return nullReturn;
        }
      }
    }

    currentLevelIndex = currentLevelIndex - MIN_CANDLES_BETWEEN_LEVELS;
    for (let j = currentLevelIndex; j >= currentLevelIndex-MAX_AMOUNT_FOR_NEXT_LEVEL; j--) {
      let isValid = IsValidHorizontalLevel({
        resistanceOrSupport,
        indexToCheck: j,
        candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
        candles
      });
      if (!isValid) continue;

      const levelCandle = candles[j];
      if (resistanceOrSupport === "resistance") {
        if (levelCandle.high <= nextLevelToCompare.low) {
          continue;
        }
        if (levelCandle.high <= candles[candles.length-1].close) {
          continue;
        }
        const priceDiff = levelCandle.high-nextLevelToCompare.low;
        if (priceDiff <= MIN_PRICE_DIFFERENCE_BETWEEN_LEVELS) {
          continue;
        }

        isValid = true;
        for (let i = j+1; i < currentLevelIndex-1; i++) {
          if (candles[i].low <= nextLevelToCompare.low) {
            isValid = false;
            break;
          }
        }
        if (!isValid) continue;

        return { level: levelCandle, index: j }
      }

      if (resistanceOrSupport === "support") {
        if (levelCandle.low >= nextLevelToCompare.high) {
          continue;
        }
        if (levelCandle.low >= candles[candles.length-1].close) {
          continue;
        }
        const priceDiff = nextLevelToCompare.high-levelCandle.low;
        if (priceDiff <= MIN_PRICE_DIFFERENCE_BETWEEN_LEVELS) {
          continue;
        }

        isValid = true;
        for (let i = j+1; i < currentLevelIndex-1; i++) {
          if (candles[i].high >= nextLevelToCompare.high) {
            isValid = false;
            break;
          }
        }
        if (!isValid) continue;

        return { level: levelCandle, index: j }
      }
    }

    return nullReturn;
  }

}
