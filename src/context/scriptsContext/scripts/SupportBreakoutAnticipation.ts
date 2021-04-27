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
  debugLog
}: ScriptFuncParameters) {
  const ENABLE_DEBUG = false;

  void trades;

  const priceAdjustment = 1; // 1/100000;

  function getParams(params: ScriptParams | null): ScriptParams {
    if (params) {
      return params;
    }

    const riskPercentage = 1.5;
    const stopLossDistance = 15 * priceAdjustment;
    const takeProfitDistance = 34 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 1 * priceAdjustment;
    const trendCandles = 90;
    const trendDiff = 30;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 14;
    const priceOffset = 2 * priceAdjustment;
    const validHours: ScriptParams["validHours"] = [
      { hour: "8:00", weekdays: [1, 2, 4, 5] },
      { hour: "8:30", weekdays: [1, 2, 4, 5] },
      { hour: "9:00", weekdays: [1, 2, 4, 5] },
      { hour: "10:00", weekdays: [1, 2, 4, 5] },
      { hour: "10:30", weekdays: [1, 2, 4, 5] },
      { hour: "11:00", weekdays: [1, 2, 4, 5] },
      { hour: "11:30", weekdays: [1, 2, 4, 5] },
      { hour: "12:00", weekdays: [1, 2, 4, 5] },
      { hour: "12:30", weekdays: [1, 2, 4, 5] },
      { hour: "13:00", weekdays: [1, 2, 4, 5] },
      { hour: "14:00", weekdays: [1, 2, 4, 5] },
      { hour: "14:30", weekdays: [1, 2, 4, 5] },
      { hour: "15:00", weekdays: [1, 2, 4, 5] },
      { hour: "15:30", weekdays: [1, 2, 4, 5] },
      { hour: "16:00", weekdays: [1, 2, 4, 5] },
      { hour: "16:30", weekdays: [1, 2, 4, 5] },
      { hour: "17:00", weekdays: [1, 2, 4, 5] },
      { hour: "18:00", weekdays: [1, 2, 4, 5] },
    ];
    const validMonths: ScriptParams["validMonths"] = [0, 2, 3, 4, 5, 7, 8, 9, 11];
    const validDays: ScriptParams["validDays"] = [
      { weekday: 1, hours: [] },
      { weekday: 2, hours: [] },
      { weekday: 4, hours: [] },
      { weekday: 5, hours: [] },
    ];

    return {
      validHours,
      validDays,
      validMonths,
      riskPercentage,
      stopLossDistance,
      takeProfitDistance,
      tpDistanceShortForBreakEvenSL,
      trendCandles,
      trendDiff,
      candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
      priceOffset,
    };
  }

  if (balance < 0) return;

  const scriptParams = getParams(params || null);

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() >= 21) {
    if (date.getHours() === 21 && date.getMinutes() === 58) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
    if (date.getHours() !== 21) {
      orders.map((mo) => closeOrder(mo.id!));
      persistedVars.pendingOrder = null;
    }
  }

  const isValidTime = isWithinTime(scriptParams.validHours!, scriptParams.validDays!, scriptParams.validMonths!, date);

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market" && o.position === "short");
    if (order) {
      debugLog(ENABLE_DEBUG, "Saved pending order", date, order);
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      if (order.price < candles[currentDataIndex].low) {
        debugLog(ENABLE_DEBUG, "Creating pending order", date, order);
        createOrder(order);
      } else {
        debugLog(ENABLE_DEBUG, "Can't create the pending order since the price is bigger than the candle.low", order.price, candles[currentDataIndex], date);
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder && marketOrder.position === "short") {
    if (
      candles[currentDataIndex].low - marketOrder.takeProfit! <
      scriptParams.tpDistanceShortForBreakEvenSL
    ) {
      debugLog(ENABLE_DEBUG, "Adjusting SL to break even ...", date, marketOrder, candles[currentDataIndex], scriptParams.tpDistanceShortForBreakEvenSL);
      marketOrder.stopLoss = marketOrder.price;
    }
  }

  if (marketOrder) {
    debugLog(ENABLE_DEBUG, "There is an open position, doing nothing ...", date, marketOrder);
    return;
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
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
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
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
      isFalsePositive = true;
      debugLog(ENABLE_DEBUG, "past_overcame", date);
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].low + scriptParams.priceOffset;
  if (price < candles[currentDataIndex].close - spread/2) {
    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
      if (!candles[i]) break;

      if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
      }
    }

    const diff = highestValue - candles[currentDataIndex].high;
    if (diff < scriptParams.trendDiff) {
      debugLog(ENABLE_DEBUG, "Diff is too big, won't create the order...", date, diff, scriptParams.trendDiff);
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price + scriptParams.stopLossDistance;
    const takeProfit = price - scriptParams.takeProfitDistance;
    const size = Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance + 1) || 1;
    // const size = (Math.floor((balance * (scriptParams.riskPercentage / 100) / scriptParams.stopLossDistance) / 100000) * 100000) / 10;

    const o = {
      type: "sell-stop" as OrderType,
      position: "short" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
    };
    debugLog(ENABLE_DEBUG, "Order to be created", date, o);
    if (!isValidTime) {
      debugLog(ENABLE_DEBUG, "Not the right time, saving the order for later...", date);
      persistedVars.pendingOrder = o;
    } else {
      debugLog(ENABLE_DEBUG, "Time is right, creating the order", date);
      createOrder(o);
    }
  } else {
    debugLog(ENABLE_DEBUG, "Can't create the order since the price is bigger than the current candle.close - the spread adjustment", date);
    debugLog(ENABLE_DEBUG, "Candle, adjustment, price", candles[currentDataIndex], spread/2, price);
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
