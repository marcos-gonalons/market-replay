import { StrategyFuncParameters, StrategyParams } from "../../../services/scriptsExecutioner/Types";

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
  debugLog,
  strategies
}: StrategyFuncParameters) {
  if (balance < 0) {
    balance = 1;
  }

  if (candles.length === 0 || currentDataIndex === 0) return;
  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 7 || date.getHours() >= 21) {
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
    const params: StrategyParams = {
      riskPercentage: 1,
      withPendingOrders: true,
      stopLossDistance: 24,
      takeProfitDistance: 34,
      tpDistanceShortForTighterSL: 0,
      slDistanceWhenTpIsVeryClose: 0,
      trendCandles: 60,
      trendDiff: 15,
      candlesAmountToBeConsideredHorizontalLevel: {
        future: 24,
        past: 24
      },
      priceOffset: 1,
      maxSecondsOpenTrade: 0,
      validHours: [
        { hour: "9:00", weekdays: [] },
        { hour: "9:30", weekdays: [] },
        { hour: "10:00", weekdays: [] },
        { hour: "10:30", weekdays: [] },
        { hour: "11:00", weekdays: [] },
        { hour: "11:30", weekdays: [] },
        { hour: "12:00", weekdays: [] },
        { hour: "12:30", weekdays: [] },
        { hour: "13:00", weekdays: [] },
        { hour: "13:30", weekdays: [] },
        { hour: "14:00", weekdays: [] },
        { hour: "16:00", weekdays: [] },
        { hour: "16:30", weekdays: [] },
        { hour: "17:00", weekdays: [] },
        { hour: "17:30", weekdays: [] },
        { hour: "20:00", weekdays: [] },
        { hour: "20:30", weekdays: [] },
      ],
      validMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      validDays: []
    }

    strategies.find(s => s.name === "Resistance Breakout")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params, strategies
    });
  }

  function support() {
    const params: StrategyParams = {
      withPendingOrders: true,
      riskPercentage: 1,
      stopLossDistance: 15,
      takeProfitDistance: 34,
      tpDistanceShortForTighterSL: 1,
      slDistanceWhenTpIsVeryClose: 0,
      trendCandles: 90,
      trendDiff: 30,
      candlesAmountToBeConsideredHorizontalLevel: {
        future: 14,
        past: 14
      },
      priceOffset: 2,
      validHours: [
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
      ],
      validMonths: [0, 2, 3, 4, 5, 7, 8, 9, 11],
      validDays: [
        { weekday: 1, hours: [] },
        { weekday: 2, hours: [] },
        { weekday: 4, hours: [] },
        { weekday: 5, hours: [] },
      ],
    };

    strategies.find(s => s.name === "Support Breakout")!.func({
      candles, orders, trades, balance, currentDataIndex, spread,
      createOrder, closeOrder, persistedVars, isWithinTime, debugLog,
      params, strategies
    });

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
  trades,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  debugLog,
  strategies
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script
}`.trim(),
    ``
  ));
