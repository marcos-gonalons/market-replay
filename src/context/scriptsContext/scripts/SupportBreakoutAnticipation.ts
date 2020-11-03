import { ScriptFuncParameters } from "../../../services/scriptsExecutioner/Types";

export default (function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  createOrder,
  closeOrder,
}: ScriptFuncParameters) {
  if (balance < 0) return;

  const priceAdjustment = 1; // 1/100000;
  const candlesToCheck = 1000;
  const ignoreLastNCandles = 15;
  const candlesAmountWithLowerPriceToBeConsideredBottom = 15;
  const candlesAmountWithoutOtherBottoms = 0;

  const riskPercentage = 1;
  const stopLossDistance = 12 * priceAdjustment;
  const takeProfitDistance = 27 * priceAdjustment;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() > 21) {
    orders.map((mo) => closeOrder(mo.id!));
    return;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder) {
    if (candles[currentDataIndex].low - marketOrder.takeProfit! < 4 * priceAdjustment) {
      marketOrder.stopLoss = marketOrder.price;
    }
  }

  if (marketOrder) return;

  for (let i = currentDataIndex - ignoreLastNCandles; i > currentDataIndex - ignoreLastNCandles - candlesToCheck; i--) {
    if (!candles[i]) break;

    let isFalsePositive = false;
    for (let j = i + 1; j < currentDataIndex; j++) {
      if (candles[j].low <= candles[i].low) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    isFalsePositive = false;
    for (let j = i - candlesAmountWithLowerPriceToBeConsideredBottom; j < i; j++) {
      if (!candles[j]) continue;
      if (candles[j].low <= candles[i].low) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    for (
      let j = i - candlesAmountWithoutOtherBottoms - candlesAmountWithLowerPriceToBeConsideredBottom;
      j < i - candlesAmountWithLowerPriceToBeConsideredBottom;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].meta?.isBottom) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    const price = candles[i].low + 2 * priceAdjustment;
    if (price < candles[currentDataIndex].low) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
      let highestValue = candles[currentDataIndex].high;

      for (let i = currentDataIndex; i > currentDataIndex - 120; i--) {
        if (!candles[i]) break;

        if (candles[i].high > highestValue) {
          highestValue = candles[i].high;
        }
      }

      const diff = highestValue - candles[currentDataIndex].high;
      if (diff < 29) {
        return;
      }

      const stopLoss = price + stopLossDistance;
      const takeProfit = price - takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance) || 1;
      // const size = (Math.floor((balance * (riskPercentage / 100) / stopLossDistance) / 100000) * 100000) / 10;
      createOrder({
        type: "sell-stop",
        position: "short",
        size,
        price,
        stopLoss,
        takeProfit,
        executeHours: [
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
            hour: "12:30",
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
            hour: "16:00",
            weekdays: [1, 2, 4, 5],
          },
          {
            hour: "16:30",
            weekdays: [1, 2, 4, 5],
          },
          {
            hour: "18:00",
            weekdays: [1, 2, 4, 5],
          },
        ],
        executeMonths: [0, 2, 3, 5, 6, 7, 8, 9, 10, 11],
      });
      candles[i].meta = { isBottom: true };
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
  balance,
  currentDataIndex,
  createOrder,
  closeOrder
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
