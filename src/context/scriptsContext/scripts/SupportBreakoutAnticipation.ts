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
  void trades;

  function getParams(params: ScriptParams | null): ScriptParams {
    if (params) {
      return params;
    }

    const riskPercentage = 1.5;
    const stopLossDistance = 12 * priceAdjustment;
    const takeProfitDistance = 27 * priceAdjustment;
    const tpDistanceShortForBreakEvenSL = 5 * priceAdjustment;
    const trendCandles = 120;
    const trendDiff = 29;
    const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 14;
    const priceOffset = 2;
    const validHours: ScriptParams["validHours"] = [
      {
        hour: "8:30",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "9:00",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "12:00",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "13:00",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "14:30",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "15:30",
        weekdays: [1, 2, 4, 5],
      },
      {
        hour: "18:00",
        weekdays: [1, 2, 4, 5],
      },
    ];
    const validMonths: ScriptParams["validMonths"] = [2, 3, 5, 8, 11];
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
      priceOffset,
    };
  }

  if (balance < 0) return;

  const priceAdjustment = 1; // 1/100000;
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

  const isValidTime = isWithinTime(
    scriptParams.validHours!,
    scriptParams.validDays!,
    scriptParams.validMonths!,
    date
  );

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
      if (order.price < candles[currentDataIndex].low - spreadAdjustment) {
        createOrder(order);
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder && marketOrder.position === "short") {
    if (candles[currentDataIndex].low - marketOrder.takeProfit! < scriptParams.tpDistanceShortForBreakEvenSL * priceAdjustment) {
      marketOrder.stopLoss = marketOrder.price;
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
  for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
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
    if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
      isFalsePositive = true;
      break;
    }
  }

  if (isFalsePositive) return;

  const price = candles[horizontalLevelCandleIndex].low + scriptParams.priceOffset * priceAdjustment;
  if (price < candles[currentDataIndex].low - spreadAdjustment) {
    orders.filter((o) => o.type !== "market" && o.position === "short").map((nmo) => closeOrder(nmo.id!));
    let highestValue = candles[currentDataIndex].high;

    for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
      if (!candles[i]) break;

      if (candles[i].high > highestValue) {
        highestValue = candles[i].high;
      }
    }

    const diff = highestValue - candles[currentDataIndex].high;
    if (diff < scriptParams.trendDiff) {
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
