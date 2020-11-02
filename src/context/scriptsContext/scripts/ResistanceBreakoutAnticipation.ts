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
  const candlesAmountWithLowerPriceToBeConsideredTop = 15;
  const candlesAmountWithoutOtherTops = 0;

  const riskPercentage = 1;
  const stopLossDistance = 13 * priceAdjustment;
  const takeProfitDistance = 26 * priceAdjustment;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() > 21) {
    orders.map((mo) => closeOrder(mo.id!));
    return;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder) {
    if (marketOrder.takeProfit! - candles[currentDataIndex].high < 4 * priceAdjustment) {
      marketOrder.stopLoss = marketOrder.price;
    }
  }

  if (marketOrder) return;

  for (let i = currentDataIndex - ignoreLastNCandles; i > currentDataIndex - ignoreLastNCandles - candlesToCheck; i--) {
    if (!candles[i]) break;

    let isFalsePositive = false;
    for (let j = i + 1; j < currentDataIndex; j++) {
      if (candles[j].high >= candles[i].high) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    isFalsePositive = false;
    for (let j = i - candlesAmountWithLowerPriceToBeConsideredTop; j < i; j++) {
      if (!candles[j]) continue;
      if (candles[j].high >= candles[i].high) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    for (
      let j = i - candlesAmountWithoutOtherTops - candlesAmountWithLowerPriceToBeConsideredTop;
      j < i - candlesAmountWithLowerPriceToBeConsideredTop;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].meta?.isTop) {
        isFalsePositive = true;
        break;
      }
    }

    if (isFalsePositive) break;

    const price = candles[i].high - 2 * priceAdjustment;
    if (price > candles[currentDataIndex].high) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price - stopLossDistance;
      const takeProfit = price + takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance) || 1;
      // const size = (Math.floor((balance * (riskPercentage / 100) / stopLossDistance) / 100000) * 100000) / 10;
      createOrder({
        type: "buy-stop",
        position: "long",
        size,
        price,
        stopLoss,
        takeProfit,
        executeHours: [
          {
            hour: "9:00",
            weekdays: [1, 2, 3, 4],
          },
          {
            hour: "9:30",
            weekdays: [1, 2, 3, 4],
          },
          {
            hour: "10:00",
            weekdays: [2],
          },
          {
            hour: "10:30",
            weekdays: [2],
          },
          {
            hour: "11:30",
            weekdays: [2, 3],
          },
          {
            hour: "12:00",
            weekdays: [1, 2, 5],
          },
          {
            hour: "12:30",
            weekdays: [1, 2, 5],
          },
          {
            hour: "13:30",
            weekdays: [2],
          },
          {
            hour: "16:30",
            weekdays: [1, 4],
          },
          {
            hour: "19:30",
            weekdays: [1, 4],
          },
        ],
        //executeMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      });
      candles[i].meta = { isTop: true };
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
