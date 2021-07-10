import { ScriptFuncParameters, ScriptParams } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";

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
}: ScriptFuncParameters) {
  const ENABLE_DEBUG = false;

  void balance;
  void trades;

  const priceAdjustment = 1 / 1000;

  function getParams(params: ScriptParams | null): ScriptParams {
    if (params) {
      return params;
    }

    const riskPercentage = 1.5;
    const stopLossDistance = 29 * priceAdjustment;
    const takeProfitDistance = 46 * priceAdjustment;
    const tpDistanceShortForTighterSL = 10 * priceAdjustment;
    const slDistanceWhenTpIsVeryClose = -15 * priceAdjustment;
    const trendCandles = 120;
    const trendDiff = 20 * priceAdjustment;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 27;
    const priceOffset = -0.5 * priceAdjustment;
    const maxSecondsOpenTrade = 35 * 24 * 60 * 60;

    const validHours: ScriptParams["validHours"] = [];
    const validMonths: ScriptParams["validMonths"] = [];
    const validDays: ScriptParams["validDays"] = [];

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

  if (candles.length <= 1 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  /*if (date.getHours() < 7 || date.getHours() >= 21) {
    if (date.getHours() === 21 && date.getMinutes() === 58) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
    if (date.getHours() !== 21) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
  }*/

  const isValidTime = isWithinTime(scriptParams.validHours!, scriptParams.validDays!, scriptParams.validMonths!, date);
  const marketOrder = orders.find((o) => o.type === "market");

  if (marketOrder && scriptParams.maxSecondsOpenTrade) {
    const diffInSeconds = Math.floor((date.valueOf() - marketOrder.createdAt!.valueOf()) / 1000);

    if (diffInSeconds >= scriptParams.maxSecondsOpenTrade) {
      debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, marketOrder);
      closeOrder(marketOrder.id!);
    }
  }

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market" && o.position === "long");
    if (order) {
      debugLog(ENABLE_DEBUG, "Saved pending order", date, order);
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      if (order.price > candles[currentDataIndex].high) {
        debugLog(ENABLE_DEBUG, "Creating pending order", date, order);
        if (!marketOrder) {
          createOrder(order);
        } else {
          debugLog(ENABLE_DEBUG, "Can't create the pending order because there is an open position", marketOrder);
        }
      } else {
        debugLog(
          ENABLE_DEBUG,
          "Can't create the pending order since the price is smaller than the candle.high",
          order.price,
          candles[currentDataIndex],
          date
        );
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  if (marketOrder && marketOrder.position === "short") {
    if (candles[currentDataIndex].low - marketOrder.takeProfit! < scriptParams.tpDistanceShortForTighterSL) {
      debugLog(
        ENABLE_DEBUG,
        "Adjusting SL ...",
        date,
        marketOrder,
        candles[currentDataIndex],
        scriptParams.tpDistanceShortForTighterSL
      );
      marketOrder.stopLoss = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
    }
  }

  const horizontalLevelCandleIndex =
    currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
  if (
    horizontalLevelCandleIndex < 0 ||
    currentDataIndex < scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
  ) {
    return;
  }

  let isFalsePositive = false;
  for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
    if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
      isFalsePositive = true;
      debugLog(ENABLE_DEBUG, "future_overcame", date);
      break;
    }
  }

  if (isFalsePositive) return;

  isFalsePositive = false;
  for (
    let j = horizontalLevelCandleIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    j < horizontalLevelCandleIndex;
    j++
  ) {
    if (!candles[j]) continue;
    if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
      isFalsePositive = true;
      debugLog(ENABLE_DEBUG, "past_overcame", date);
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].high - scriptParams.priceOffset;
  if (price > candles[currentDataIndex].close + spread / 2) {
    // orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
      if (!candles[i]) break;

      if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
      }
    }

    const diff = highestValue - candles[currentDataIndex].high;
    if (diff < scriptParams.trendDiff) {
      debugLog(ENABLE_DEBUG, "Diff is too small, won't create the order...", date, diff, scriptParams.trendDiff);
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price + scriptParams.stopLossDistance;
    const takeProfit = price - scriptParams.takeProfitDistance;
    // const size = Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance + 1) || 1;
    // const size = (Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance / 100000) * 100000) / 10;
    const size = 10000;

    const o = {
      type: "sell-limit" as OrderType,
      position: "short" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
      rollover: 0.7,
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
      "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
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
