import { ScriptFuncParameters } from "../../../services/scriptsExecutioner/Types";
import { Order, OrderType, Position } from "../../tradesContext/Types";

/**
 * Bounces on OBVIOUS RANGES
 */

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
}: ScriptFuncParameters) {
  if (balance < 0) return;

  const priceAdjustment = 1; // 1/100000;
  const candlesToCheck = 1000;

  const riskPercentage = 1.5;
  const stopLossDistance = 12 * priceAdjustment;
  const takeProfitDistance = 27 * priceAdjustment;

  if (candles.length === 0 || currentDataIndex === 0) return;

  const date = new Date(candles[currentDataIndex].timestamp);

  if (date.getHours() < 8 || date.getHours() > 21) {
    orders.map((mo) => closeOrder(mo.id!));
  }

  const isValidTime = isWithinTime([], [], [], date);

  if (!isValidTime) {
    const order = orders.find((o) => o.type !== "market");
    if (order) {
      persistedVars.pendingOrder = { ...order };
      closeOrder(order.id!);
      return;
    }
  } else {
    if (persistedVars.pendingOrder) {
      const order = persistedVars.pendingOrder as Order;
      // adust this in case I'm doing shorts
      if (order.position === "short") {
        if (order.price < candles[currentDataIndex].low - spreadAdjustment) {
          createOrder(order);
        }
      } else {
        if (order.price > candles[currentDataIndex].high + spreadAdjustment) {
          createOrder(order);
        }
      }
      persistedVars.pendingOrder = null;
      return;
    }
    persistedVars.pendingOrder = null;
  }

  const marketOrder = orders.find((o) => o.type === "market");
  if (marketOrder) return;

  for (let i = currentDataIndex; i > currentDataIndex - candlesToCheck; i--) {
    if (!candles[i]) break;
    orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

    //
    const price = 0;
    //

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
    candles[i].meta = { isTop: true };
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
  spreadAdjustment,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime
}) {
`.trim(),
    ``
  )
  .replace(
    ` // end script

}`.trim(),
    ``
  ));
