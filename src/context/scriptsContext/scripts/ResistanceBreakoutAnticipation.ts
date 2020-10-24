import { ScriptFuncParameters } from "../../../services/scriptsExecutioner/Types";

export default (function f({
  canvas,
  ctx,
  candles,
  drawings,
  orders,
  persistedVars,
  balance,
  currentDataIndex,
  createOrder,
  removeAllOrders,
}: ScriptFuncParameters) {
  void canvas;
  void ctx;
  void candles;
  void drawings;
  void orders;
  void persistedVars;
  void balance;
  void currentDataIndex;
  void createOrder;
  void removeAllOrders;

  const candlesToCheck = 1000;
  const ignoreLastNCandles = 15;
  const candlesAmountWithLowerPriceToBeConsideredTop = 15;
  const candlesAmountWithoutOtherTops = 15;

  const riskPercentage = 1;
  const stopLossDistance = 13;
  const takeProfitDistance = 26;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() > 21) {
    // TODO: If there is a market order: transform it to a trade. Somehow.
    removeAllOrders();
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
    let isThereALimitOrStopOrder = false;
    for (const order of orders) {
      if (order.type === "market") {
        isThereAMarketOrder = true;
      }
      if (order.type !== "market") {
        isThereALimitOrStopOrder = true;
      }
    }

    const price = candles[i].high - 2;
    if (price > candles[currentDataIndex].high) {
      if (isThereALimitOrStopOrder) {
        removeAllOrders();
      }

      const stopLoss = price - stopLossDistance;
      const takeProfit = price + takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance) || 1;
      if (!isThereAMarketOrder) {
        createOrder({
          type: "buy-stop",
          position: "long",
          size,
          price,
          stopLoss,
          takeProfit,
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
  canvas,
  ctx,
  candles,
  drawings,
  orders,
  persistedVars,
  balance,
  currentDataIndex,
  createOrder,
  removeAllOrders
}) {
  void canvas;
  void ctx;
  void candles;
  void drawings;
  void orders;
  void persistedVars;
  void balance;
  void currentDataIndex;
  void createOrder;
  void removeAllOrders;
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
