import { ScriptFuncParameters } from "../../../services/scriptsExecutioner/Types";

export default (function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  createOrder,
  closeOrder,
}: ScriptFuncParameters) {
  const candlesToCheck = 1000;
  const ignoreLastNCandles = 15;
  const candlesAmountWithLowerPriceToBeConsideredTop = 15;
  const candlesAmountWithoutOtherTops = 15;

  const riskPercentage = 1;
  const stopLossDistance = 16;
  const takeProfitDistance = 18;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() > 21) {
    orders.map((mo) => closeOrder(mo.id!));
    return;
  }

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

    let isThereAMarketOrder = false;
    for (const order of orders) {
      if (order.type === "market") {
        isThereAMarketOrder = true;
      }
    }

    const price = candles[i].high - 2;
    if (price > candles[currentDataIndex].high) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price + stopLossDistance;
      const takeProfit = price - takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance) || 1;
      if (!isThereAMarketOrder) {
        createOrder({
          type: "sell-limit",
          position: "short",
          size,
          price,
          stopLoss,
          takeProfit,
          executeHours: [16],
        });
        candles[i].meta = { isTop: true };
      }
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
