import { StrategyFuncParameters, StrategyParams } from "../../../services/scriptsExecutioner/Types";
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
}: StrategyFuncParameters) {
  void trades;

  function getParams(params: StrategyParams | null): StrategyParams {
    if (params) {
      return params;
    }

    const riskPercentage = 1.5;
    const stopLossDistance = 14 * priceAdjustment;
    const takeProfitDistance = 29 * priceAdjustment;
    const tpDistanceShortForTighterSL = 1 * priceAdjustment;
    const slDistanceWhenTpIsVeryClose = 0 * priceAdjustment;
    const trendCandles = 120;
    const trendDiff = 7;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 15;
    const priceOffset = 2 * priceAdjustment;

    const validHours: StrategyParams["validHours"] = [
      { hour: "0:00", weekdays: [1, 2, 3, 4] },
      { hour: "0:30", weekdays: [1, 2, 3, 4] },
      { hour: "1:00", weekdays: [1, 2, 3, 4] },
      { hour: "1:30", weekdays: [1, 2, 3, 4] },
      { hour: "2:00", weekdays: [1, 2, 3, 4] },
      { hour: "2:30", weekdays: [1, 2, 3, 4] },
      { hour: "3:00", weekdays: [1, 2, 3, 4] },
      { hour: "3:30", weekdays: [1, 2, 3, 4] },
      { hour: "4:00", weekdays: [1, 2, 3, 4] },
      { hour: "4:30", weekdays: [1, 2, 3, 4] },
      { hour: "5:00", weekdays: [1, 2, 3, 4] },
      { hour: "5:30", weekdays: [1, 2, 3, 4] },
      { hour: "6:00", weekdays: [1, 2, 3, 4] },
      { hour: "6:30", weekdays: [1, 2, 3, 4] },
      { hour: "7:00", weekdays: [1, 2, 3, 4] },
      { hour: "7:30", weekdays: [1, 2, 3, 4] },
      { hour: "8:00", weekdays: [1, 2, 3, 4] },
      { hour: "8:30", weekdays: [1, 2, 3, 4] },
      { hour: "9:00", weekdays: [1, 2, 3, 4] },
      { hour: "9:30", weekdays: [1, 2, 3, 4] },
      { hour: "10:00", weekdays: [1, 2, 3, 4] },
      { hour: "10:30", weekdays: [1, 2, 3, 4] },
      { hour: "11:00", weekdays: [1, 2, 3, 4] },
      { hour: "11:30", weekdays: [1, 2, 3, 4] },
      { hour: "12:00", weekdays: [1, 2, 3, 4] },
      { hour: "12:30", weekdays: [1, 2, 3, 4] },
      { hour: "13:00", weekdays: [1, 2, 3, 4] },
      { hour: "13:30", weekdays: [1, 2, 3, 4] },
      { hour: "14:00", weekdays: [1, 2, 3, 4] },
      { hour: "14:30", weekdays: [1, 2, 3, 4] },
      { hour: "15:00", weekdays: [1, 2, 3, 4] },
      { hour: "15:30", weekdays: [1, 2, 3, 4] },
      { hour: "16:00", weekdays: [1, 2, 3, 4] },
      { hour: "17:00", weekdays: [1, 2, 3, 4] },
      { hour: "17:30", weekdays: [1, 2, 3, 4] },
      { hour: "18:00", weekdays: [1, 2, 3, 4] },
      { hour: "18:30", weekdays: [1, 2, 3, 4] },
      { hour: "19:00", weekdays: [1, 2, 3, 4] },
      { hour: "19:30", weekdays: [1, 2, 3, 4] },
      { hour: "20:30", weekdays: [1, 2, 3, 4] },
      { hour: "21:00", weekdays: [1, 2, 3, 4] },
      { hour: "21:30", weekdays: [1, 2, 3, 4] },
    ];
    const validMonths: StrategyParams["validMonths"] = [0, 2, 3, 4, 5, 6, 7, 9, 10, 11];
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
    };
  }

  if (balance < 0) return;

  const priceAdjustment = 1; // 1/100000;
  const scriptParams = getParams(params || null);

  if (candles.length === 0 || currentDataIndex === 0) return;
  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 1 || date.getHours() >= 21) {
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
    const order = orders.find((o) => o.type !== "market" && o.position === "long");
    if (order) {
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      if (order.price > candles[currentDataIndex].high + spread / 2) {
        if (order.position === "short") {
          order.type = "sell-limit";
        }
        createOrder(order);
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder && marketOrder.position === "long") {
    if (marketOrder.takeProfit! - candles[currentDataIndex].high < scriptParams.tpDistanceShortForTighterSL) {
      marketOrder.stopLoss = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
    }
  }

  if (marketOrder) return;

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

  const price = candles[horizontalLevelCandleIndex].high - scriptParams.priceOffset;
  if (price > candles[currentDataIndex].close + spread / 2) {
    orders.filter((o) => o.type !== "market" && o.position === "long").map((nmo) => closeOrder(nmo.id!));
    let lowestValue = candles[currentDataIndex - 1].low;

    for (let i = currentDataIndex - 1; i > currentDataIndex - scriptParams.trendCandles; i--) {
      if (!candles[i]) break;

      if (candles[i].low < lowestValue) {
        lowestValue = candles[i].low;
      }
    }

    const diff = candles[currentDataIndex - 1].low - lowestValue;
    if (diff < scriptParams.trendDiff) {
      return;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const stopLoss = price - scriptParams.stopLossDistance;
    const takeProfit = price + scriptParams.takeProfitDistance;
    const size = 1; // Math.floor((balance * (scriptParams.riskPercentage / 100)) / scriptParams.stopLossDistance + 1) || 1;
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
    candles[currentDataIndex].meta = { isTop: true };
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
