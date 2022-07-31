import { StrategyFuncParameters } from "../../../services/scriptsExecutioner/Types";
import { OrderType, Position } from "../../tradesContext/Types";

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

  debugLog(ENABLE_DEBUG, "Params ", params);
  const date = new Date(candles[currentDataIndex].timestamp);

  if (!isWithinTime([], [], params!.validMonths || [], date) || !isWithinTime([], params!.validDays || [], [], date)) {
    return;
  }
  const isValidTime = isWithinTime(params!.validHours || [], params!.validDays || [], params!.validMonths || [], date);
  void isValidTime;
  if (balance < 0) {
    balance = 1;
  }
  if (candles.length <= 1 || currentDataIndex === 0) return;

  const marketOrder = orders.find((o) => o.type === "market");

  if (marketOrder && params!.maxSecondsOpenTrade) {
    const diffInSeconds = Math.floor((date.valueOf() - marketOrder.createdAt!.valueOf()) / 1000);

    if (diffInSeconds >= params!.maxSecondsOpenTrade) {
      debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, marketOrder);
      closeOrder(marketOrder.id!);
    }
  }

  if (marketOrder && marketOrder.position === "long") {
    const newSLPrice = marketOrder.price + params!.slDistanceWhenTpIsVeryClose!;
    if (
      candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
      marketOrder.takeProfit! - candles[currentDataIndex].high < params!.tpDistanceShortForTighterSL! &&
      candles[currentDataIndex].close > newSLPrice
    ) {
      debugLog(
        ENABLE_DEBUG,
        "Adjusting SL ...",
        date,
        marketOrder,
        candles[currentDataIndex],
        params!.tpDistanceShortForTighterSL
      );
      marketOrder.stopLoss = newSLPrice;
    }
  }

  const horizontalLevelCandleIndex =
    currentDataIndex - params!.candlesAmountToBeConsideredHorizontalLevel!.future;
  if (
    horizontalLevelCandleIndex < 0 ||
    currentDataIndex < params!.candlesAmountToBeConsideredHorizontalLevel!.future + params!.candlesAmountToBeConsideredHorizontalLevel!.past
  ) {
    return;
  }

  let isFalsePositive = false;
  for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
      isFalsePositive = true;
      debugLog(ENABLE_DEBUG, "future_overcame", date);
      break;
    }
  }

  if (isFalsePositive) return;

  isFalsePositive = false;
  for (
    let j = horizontalLevelCandleIndex - params!.candlesAmountToBeConsideredHorizontalLevel!.past;
    j < horizontalLevelCandleIndex;
    j++
  ) {
    if (!candles[j]) continue;
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
      isFalsePositive = true;
      debugLog(ENABLE_DEBUG, "past_overcame", date);
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].low + params!.priceOffset!;
  if (price < candles[currentDataIndex].close - spread / 2) {
    let lowestValue = candles[currentDataIndex].low;

    for (let i = currentDataIndex; i > currentDataIndex - params!.trendCandles!; i--) {
      if (!candles[i]) break;

      if (candles[i].low < lowestValue) {
        lowestValue = candles[i].low;
      }
    }

    const diff = candles[currentDataIndex].low - lowestValue;
    if (diff < params!.trendDiff!) {
      debugLog(ENABLE_DEBUG, "Diff is too big, won't create the order...", date, diff, params!.trendDiff);
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price - params!.stopLossDistance;
    const takeProfit = price + params!.takeProfitDistance;

    //const size =
    //Math.floor((balance * (params!.riskPercentage / 100)) / (params!.stopLossDistance * 1000 * 0.93)) *
    //10000 || 10000;
    const size = 10000;

    const rollover = (0.7 * size) / 10000;
    const o = {
      type: "buy-limit" as OrderType,
      position: "long" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
      rollover,
    };
    debugLog(ENABLE_DEBUG, "Order to be created", date, o);

    if (marketOrder) {
      debugLog(ENABLE_DEBUG, "There is an open position, not creating the order ...", date, marketOrder);
      return;
    }

    debugLog(ENABLE_DEBUG, "Time is right, creating the order", date);
    createOrder(o);
  } else {
    debugLog(
      ENABLE_DEBUG,
      "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
      date
    );
    debugLog(ENABLE_DEBUG, "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
  }

}
