import { ScriptFuncParameters } from "../../../services/scriptsExecutioner/Types";
import { Candle } from "../../globalContext/Types";

export default (function f({
  candles,
  orders,
  balance,
  currentDataIndex,
  closeOrder,
  createOrder,
}: ScriptFuncParameters) {
  if (balance < 0) return;
  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);
  if (date.getHours() < 8 || date.getHours() > 21) {
    orders.map((mo) => closeOrder(mo.id!));
    return;
  }

  let isThereAMarketOrder = false;
  for (const order of orders) {
    if (order.type === "market") {
      isThereAMarketOrder = true;
    }
  }
  if (isThereAMarketOrder) return;

  const candlesToCheck = 200;
  const candlesAmountWithHigherPriceToBeConsideredBottom = 15;
  for (let i = currentDataIndex; i > currentDataIndex - candlesToCheck; i--) {
    if (!candles[i]) continue;

    let candleIsBottom = true;
    for (let j = i + 1; j < i + candlesAmountWithHigherPriceToBeConsideredBottom; j++) {
      if (!candles[j] || candles[j].low <= candles[i].low) {
        candleIsBottom = false;
        break;
      }
    }

    if (!candleIsBottom) continue;

    for (let j = i - 1; j > i - candlesAmountWithHigherPriceToBeConsideredBottom; j--) {
      if (!candles[j] || candles[j].low <= candles[i].low) {
        candleIsBottom = false;
        break;
      }
    }

    if (!candleIsBottom) continue;

    candles[i].meta = { isBottom: true };
    break;
  }

  for (let i = currentDataIndex; i > currentDataIndex - candlesToCheck; i--) {
    if (!candles[i]) continue;
    if (!candles[i].meta?.isBottom) continue;

    if (
      candles[currentDataIndex].close < candles[currentDataIndex].open &&
      candles[i].low >= candles[currentDataIndex].low &&
      candles[i].low <= candles[currentDataIndex].high &&
      candles[currentDataIndex].low < candles[i].low
    ) {
      let thereIsACloseOne = false;
      for (let j = currentDataIndex - 30; j < currentDataIndex; j++) {
        if (candles[j].meta?.isBreakout) {
          thereIsACloseOne = true;
          break;
        }
      }
      if (!thereIsACloseOne) {
        candles[currentDataIndex].meta = {
          isBreakout: true,
          bottomCandle: candles[i],
        };
      }
    }
    break;
  }

  for (let i = currentDataIndex; i > currentDataIndex - candlesToCheck; i--) {
    if (!candles[i]) continue;
    if (!candles[i].meta?.isBreakout) continue;

    const bottomCandle = candles[i].meta?.bottomCandle as Candle;

    // console.log("Breakout candle at", new Date(candles[i].timestamp));
    // console.log("The bottom is here", new Date(bottomCandle.timestamp));
    let candlesAmount = 0;
    for (let j = i + 1; j < currentDataIndex; j++) {
      candlesAmount++;
      if (!candles[j] || candles[j].high >= candles[i].high || candlesAmount === 10) {
        break;
      }
    }
    if (candlesAmount !== 10 || candles[currentDataIndex].high >= bottomCandle.low) {
      break;
    }

    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    const priceAdjustment = 1; // 1/100000;
    const riskPercentage = 1;
    const stopLossDistance = 15 * priceAdjustment;
    const takeProfitDistance = 25 * priceAdjustment;
    const price = bottomCandle.low;
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
    });
    break;
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
  closeOrder,
  createOrder
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
