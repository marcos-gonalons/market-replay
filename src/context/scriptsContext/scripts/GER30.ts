import { ScriptFuncParameters, ScriptParams } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";

export default (function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  spreadAdjustment,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
}: ScriptFuncParameters) {
  if (balance < 0) return;
  void params;

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

  function resistance() {
    const priceAdjustment = 1; // 1/100000;
    const riskPercentage = 1.5;
    const stopLossDistance = 16 * priceAdjustment;
    const takeProfitDistance = 34 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 2 * priceAdjustment;
    const trendCandles = 90;
    const trendDiff = 5;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 21;
    const priceOffset = 1;
    const validHours: ScriptParams["validHours"] = [
      { hour: "9:00", weekdays: [] },
      { hour: "10:00", weekdays: [] },
      { hour: "10:30", weekdays: [] },
      { hour: "11:00", weekdays: [] },
      { hour: "11:30", weekdays: [] },
      { hour: "12:00", weekdays: [] },
      { hour: "12:30", weekdays: [] },
      { hour: "15:30", weekdays: [] },
      { hour: "16:00", weekdays: [] },
      { hour: "16:30", weekdays: [] },
      { hour: "17:00", weekdays: [] },
      { hour: "18:30", weekdays: [] },
      { hour: "19:00", weekdays: [] },
      { hour: "19:30", weekdays: [] },
      { hour: "20:00", weekdays: [] },
      { hour: "20:30", weekdays: [] },
      { hour: "21:00", weekdays: [] },
    ];
    const validMonths: ScriptParams["validMonths"] = [0, 1, 2, 3, 4, 5];
    const validDays: ScriptParams["validDays"] = [];

    if (!isWithinTime([], [], validMonths, date) || !isWithinTime([], validDays, [], date)) {
      return;
    }

    const isValidTime = isWithinTime(validHours!, validDays!, validMonths!, date);

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
        if (order.position === "long") {
          if (order.price > candles[currentDataIndex].high) {
            createOrder(order);
          }
          persistedVars.pendingOrder = null;
          return;
        }
      }
      persistedVars.pendingOrder = null;
    }

    const marketOrder = orders.find((o) => o.type === "market");
    if (marketOrder && marketOrder.position === "long") {
      if (marketOrder.takeProfit! - candles[currentDataIndex].high < tpDistanceShortForBreakEvenSL) {
        marketOrder.stopLoss = marketOrder.price;
      }
    }

    if (marketOrder) return;

    const horizontalLevelCandleIndex = currentDataIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
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
      let j = horizontalLevelCandleIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
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

    const price = candles[horizontalLevelCandleIndex].high - priceOffset * priceAdjustment;
    if (price > candles[currentDataIndex].close + spreadAdjustment) {
      orders.filter((o) => o.type !== "market" && o.position === "long").map((nmo) => closeOrder(nmo.id!));
      let lowestValue = candles[currentDataIndex].low;

      for (let i = currentDataIndex; i > currentDataIndex - trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].low < lowestValue) {
          lowestValue = candles[i].low;
        }
      }

      const diff = candles[currentDataIndex].low - lowestValue;
      if (diff < trendDiff) {
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price - stopLossDistance;
      const takeProfit = price + takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance + 1) || 1;
      // const size = (Math.floor((balance * (riskPercentage / 100) / stopLossDistance) / 100000) * 100000) / 10;

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
  }

  function support() {
    const priceAdjustment = 1; // 1/100000;
    const riskPercentage = 1.5;
    const stopLossDistance = 15 * priceAdjustment;
    const takeProfitDistance = 34 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 1 * priceAdjustment;
    const trendCandles = 90;
    const trendDiff = 30;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 14;
    const priceOffset = 2;
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

    if (!isWithinTime([], [], validMonths, date) || !isWithinTime([], validDays, [], date)) {
      return;
    }
    const isValidTime = isWithinTime(validHours!, validDays!, validMonths!, date);

    if (!isValidTime) {
      const order = orders.find((o) => o.type !== "market" && o.position === "short");
      if (order) {
        persistedVars.pendingOrder = { ...order };
        closeOrder(order.id!);
        return;
      }
    } else {
      if (persistedVars.pendingOrder) {
        const order = persistedVars.pendingOrder as Order;
        if (order.position === "short") {
          if (order.price < candles[currentDataIndex].low) {
            createOrder(order);
          }
          persistedVars.pendingOrder = null;
          return;
        }
      }
      persistedVars.pendingOrder = null;
    }

    const marketOrder = orders.find((o) => o.type === "market");
    if (marketOrder && marketOrder.position === "short") {
      if (candles[currentDataIndex].low - marketOrder.takeProfit! < tpDistanceShortForBreakEvenSL * priceAdjustment) {
        marketOrder.stopLoss = marketOrder.price;
      }
    }

    if (marketOrder) return;

    const horizontalLevelCandleIndex = currentDataIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
    ) {
      return;
    }

    let isFalsePositive = false;
    for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
      if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) return;

    isFalsePositive = false;
    for (
      let j = horizontalLevelCandleIndex - candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
      j < horizontalLevelCandleIndex;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) return;

    const price = candles[horizontalLevelCandleIndex].low + priceOffset * priceAdjustment;
    if (price < candles[currentDataIndex].close - spreadAdjustment) {
      orders.filter((o) => o.type !== "market" && o.position === "short").map((nmo) => closeOrder(nmo.id!));
      let highestValue = candles[currentDataIndex].high;

      for (let i = currentDataIndex; i > currentDataIndex - trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].high > highestValue) {
          highestValue = candles[i].high;
        }
      }

      const diff = highestValue - candles[currentDataIndex].high;
      if (diff < trendDiff) {
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price + stopLossDistance;
      const takeProfit = price - takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance + 1) || 1;
      // const size = (Math.floor((balance * (riskPercentage / 100) / stopLossDistance) / 100000) * 100000) / 10;

      const o = {
        type: "sell-stop" as OrderType,
        position: "short" as Position,
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
  }

  support();
  resistance();

  // end script
}
  .toString()
  .replace(
    `
function f({
  candles,
  orders,
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
