import { StrategyFuncParameters, StrategyParams } from "../../../services/scriptsExecutioner/Types";
import { OrderType, Position } from "../../tradesContext/Types";

export default (function f({
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
  void isWithinTime;
  void balance;
  void trades;

  const priceAdjustment = 1 / 10000;

  function getParams(params: StrategyParams | null): StrategyParams {
    if (params) {
      return params;
    }

    const riskPercentage = 1;
    const stopLossDistance = 200 * priceAdjustment;
    const takeProfitDistance = 120 * priceAdjustment;
    const tpDistanceShortForTighterSL = 0 * priceAdjustment;
    const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
    const trendCandles = 180;
    const trendDiff = 70 * priceAdjustment;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 50;
    const priceOffset = 30 * priceAdjustment;
    const maxSecondsOpenTrade = 18 * 24 * 60 * 60;
    const validHours: StrategyParams["validHours"] = [];
    const validMonths: StrategyParams["validMonths"] = [];
    const validDays: StrategyParams["validDays"] = [];

    return {
      validHours,
      validDays,
      validMonths,
      riskPercentage,
      stopLossDistance,
      takeProfitDistance,
      tpDistanceShortForTighterSL,
      slDistanceWhenTpIsVeryClose,
      trendCandles,
      trendDiff,
      candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
      priceOffset,
      maxSecondsOpenTrade,
    };
  }

  const scriptParams = getParams(params || null);
  debugLog(ENABLE_DEBUG, "Params ", scriptParams);

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);
  const marketOrder = orders.find((o) => o.type === "market");

  if (marketOrder && scriptParams.maxSecondsOpenTrade) {
    const diffInSeconds = Math.floor((date.valueOf() - marketOrder.createdAt!.valueOf()) / 1000);

    if (diffInSeconds >= scriptParams.maxSecondsOpenTrade) {
      debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, marketOrder);
      closeOrder(marketOrder.id!);
    }
  }

  if (marketOrder && marketOrder.position === "short") {
    if (
      candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
      candles[currentDataIndex].low - marketOrder.takeProfit! < scriptParams.tpDistanceShortForTighterSL!
    ) {
      debugLog(
        ENABLE_DEBUG,
        "Adjusting SL ...",
        date,
        marketOrder,
        candles[currentDataIndex],
        scriptParams.tpDistanceShortForTighterSL
      );
      marketOrder.stopLoss = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose!;
    }
  }

  const horizontalLevelCandleIndex =
    currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel!;
  if (
    horizontalLevelCandleIndex < 0 ||
    currentDataIndex < scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel! * 2
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
    let j = horizontalLevelCandleIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel!;
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

  const price = candles[horizontalLevelCandleIndex].low + scriptParams.priceOffset!;
  if (price < candles[currentDataIndex].close - spread / 2) {
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles!; i--) {
      if (!candles[i]) break;

      if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
      }
    }

    const diff = highestValue - candles[currentDataIndex].high;
    if (diff < scriptParams.trendDiff!) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
      debugLog(ENABLE_DEBUG, "Diff is too big, won't create the order...", date, diff, scriptParams.trendDiff);
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price + scriptParams.stopLossDistance;
    const takeProfit = price - scriptParams.takeProfitDistance;
    /*const size =
      Math.floor((balance * (scriptParams.riskPercentage / 100)) / (scriptParams.stopLossDistance * 1000 * 0.93)) *
        10000 || 10000;*/
    const size = 10000;

    const rollover = (0.7 * size) / 10000;
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

  // end script
}
  .toString()
  .replace(
    `
function f({
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
  debugLog
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
