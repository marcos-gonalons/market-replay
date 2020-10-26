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

  const candlesToCheck = 1000;
  const ignoreLastNCandles = 15;
  const candlesAmountWithLowerPriceToBeConsideredBottom = 15;
  const candlesAmountWithoutOtherBottoms = 15;

  const riskPercentage = 1;
  const stopLossDistance = 13;
  const takeProfitDistance = 26;

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

    let isThereAMarketOrder = false;
    for (const order of orders) {
      if (order.type === "market") {
        isThereAMarketOrder = true;
      }
    }

    const price = candles[i].low + 2;
    if (price < candles[currentDataIndex].low) {
      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price - stopLossDistance;
      const takeProfit = price + takeProfitDistance;
      const size = Math.floor((balance * (riskPercentage / 100)) / stopLossDistance) || 1;
      if (!isThereAMarketOrder) {
        createOrder({
          type: "buy-limit",
          position: "long",
          size,
          price,
          stopLoss,
          takeProfit,
        });
        candles[i].meta = { isBottom: true };
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
