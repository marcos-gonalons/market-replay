import { ScriptFuncParameters, ScriptParams } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";

export default (function f({
  candles,
  orders,
  trades,
  balance,
  currentDataIndex,
  spreadAdjustment,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
}: ScriptFuncParameters) {
  void isWithinTime;

  function getParams(params: ScriptParams | null): ScriptParams {
    if (params) {
      return params;
    }

    const riskPercentage = 1.5;
    const stopLossDistance = 12 * priceAdjustment;
    const takeProfitDistance = 27 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 1 * priceAdjustment;
    const trendCandles = 90;
    const trendDiff = 20;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 21;
    const extraTrade = {
      stopLossDistance, takeProfitDistance, tpDistanceShortForBreakEvenSL
    }
    const validHours: ScriptParams["validHours"] = [
      { hour: "9:00", weekdays: [] },
      { hour: "9:30", weekdays: [] },
      { hour: "10:00", weekdays: [] },
      { hour: "11:00", weekdays: [] },
      { hour: "11:30", weekdays: [] },
      { hour: "12:00", weekdays: [] },
      { hour: "12:30", weekdays: [] },
      { hour: "13:00", weekdays: [] },
      { hour: "13:30", weekdays: [] },
      { hour: "14:00", weekdays: [] },
      { hour: "14:30", weekdays: [] },
      { hour: "16:00", weekdays: [] },
      { hour: "16:30", weekdays: [] },
      { hour: "17:00", weekdays: [] },
      { hour: "17:30", weekdays: [] },
      { hour: "18:30", weekdays: [] },
      { hour: "20:00", weekdays: [] },
      { hour: "20:30", weekdays: [] },
      { hour: "21:30", weekdays: [] },
  ];
    const validMonths: ScriptParams["validMonths"] = [0,1,2,3,4,8];
    const validDays: ScriptParams["validDays"] = [];

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
      extraTrade
    };
  }

  if (balance < 0) return;

  const priceAdjustment = 1; // 1/100000;
  const scriptParams = getParams(params || null);

  if (candles.length <= 1 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);
  const previousDate = new Date(candles[currentDataIndex-1].timestamp);

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

 const isValidTime = isWithinTime(
    scriptParams.validHours!,
    scriptParams.validDays!,
    scriptParams.validMonths!,
    date
  );

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market" && o.position === "long");
    if (order) {
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      if (order.price > candles[currentDataIndex].high + spreadAdjustment) {
        createOrder(order);
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder && marketOrder.position === "long") {
    if (marketOrder.takeProfit! - candles[currentDataIndex].high < scriptParams.tpDistanceShortForBreakEvenSL) {
      marketOrder.stopLoss = marketOrder.price;
    }
  }

  if (marketOrder) return;

  const lastTrade = trades[trades.length-1];
  if (
    trades.length > <number>persistedVars.lastAmountOfTrades &&
    !persistedVars.extraTrade && lastTrade.result < 0
  ) {
    const price = lastTrade.endPrice;

    const stopLoss = price + scriptParams.extraTrade!.stopLossDistance;
    const takeProfit = price - scriptParams.extraTrade!.takeProfitDistance;
    const size = 1; //Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.extraTrade!.stopLossDistance + 1) || 1;
    
    const o: Order = {
      type: "market" as OrderType,
      position: "short" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
    };

    o.createdAt = lastTrade.endDate;
    o.fillDate = lastTrade.endDate;

    // createOrder(o);

    persistedVars.extraTrade = true;
    return;
  }

  persistedVars.lastAmountOfTrades = trades.length;

  if (date.getDate() !== previousDate.getDate()) {
    persistedVars.extraTrade = false;
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
  for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex - 1; j++) {
    if (candles[j].high >= candles[horizontalLevelCandleIndex].high) {
      isFalsePositive = true;
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
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].high - 2 * priceAdjustment;
  if (price > candles[currentDataIndex].high + spreadAdjustment) {
    orders.filter((o) => o.type !== "market" && o.position === "long").map((nmo) => closeOrder(nmo.id!));
    let lowestValue = candles[currentDataIndex].low;

    for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
      if (!candles[i]) break;

      if (candles[i].low < lowestValue) {
        lowestValue = candles[i].low;
      }
    }

    const diff = candles[currentDataIndex].low - lowestValue;
    if (diff < scriptParams.trendDiff) {
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price - scriptParams.stopLossDistance;
    const takeProfit = price + scriptParams.takeProfitDistance;
    const size = Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance + 1) || 1;
    // const size = (Math.floor((balance * (scriptParams.riskPercentage / 100) / scriptParams.stopLossDistance) / 100000) * 100000) / 10;

    const o = {
      type: "buy-stop" as OrderType,
      position: "long" as Position,
      size,
      price,
      stopLoss,
      takeProfit,
    };
    if (!isValidTime) {
      persistedVars.pendingOrder = o;
    } else {
      createOrder(o);
    }
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
  spreadAdjustment,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
