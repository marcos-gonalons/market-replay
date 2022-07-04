import { StrategyFuncParameters } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";
import { handlePendingOrder } from "./common/HandlePendingOrders";

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

  if (params!.withPendingOrders) {
    handlePendingOrder({
      isValidTime,
      orders,
      candles,
      currentDataIndex,
      openPosition: marketOrder,
      position: "short",
      pendingOrder: persistedVars.pendingOrder as Order,

      setPendingOrder: (o: Order | null) => {
        persistedVars.pendingOrder = o;
      },
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg);
      },
      closeOrder,
      createOrder,
    });
  }

  if (marketOrder && marketOrder.position === "short") {
    if (
      candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
      candles[currentDataIndex].low - marketOrder.takeProfit! < params!.tpDistanceShortForTighterSL!
    ) {
      debugLog(
        ENABLE_DEBUG,
        "Adjusting SL ...",
        date,
        marketOrder,
        candles[currentDataIndex],
        params!.tpDistanceShortForTighterSL
      );
      marketOrder.stopLoss = marketOrder.price + params!.slDistanceWhenTpIsVeryClose!;
    }
  }

  const horizontalLevelCandleIndex =
    currentDataIndex - params!.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel!;
  if (
    horizontalLevelCandleIndex < 0 ||
    currentDataIndex < params!.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel! * 2
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
    let j = horizontalLevelCandleIndex - params!.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel!;
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
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - params!.trendCandles!; i--) {
      if (!candles[i]) break;

      if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
      }
    }

    const diff = highestValue - candles[currentDataIndex].high;
    if (diff < params!.trendDiff!) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
      debugLog(ENABLE_DEBUG, "Diff is too big, won't create the order...", date, diff, params!.trendDiff);
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price + params!.stopLossDistance;
    const takeProfit = price - params!.takeProfitDistance;
    const size = 1; // Math.floor((balance * (params!.riskPercentage / 100)) / params!.stopLossDistance + 1) || 1;
    const rollover = 0;
    const o = {
      type: "sell-stop" as OrderType,
      position: "short" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
      rollover,
    };
    debugLog(ENABLE_DEBUG, "Order to be created", date, o);

    if (marketOrder) {
      debugLog(ENABLE_DEBUG, "There is an open position, saving the order for later...", date, marketOrder);
      persistedVars.pendingOrder = o;
      return;
    }
    
    if (!isValidTime) {
      debugLog(ENABLE_DEBUG, "Not the right time, saving the order for later...", date);
      persistedVars.pendingOrder = o;
      return;
    }

    debugLog(ENABLE_DEBUG, "Time is right, creating the order", date);
    createOrder(o);
  } else {
    debugLog(
      ENABLE_DEBUG,
      "Can't create the order since the price is bigger than the current candle.close - the spread adjustment",
      date
    );
    debugLog(ENABLE_DEBUG, "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
  }

}
