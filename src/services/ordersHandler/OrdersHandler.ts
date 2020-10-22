import { Trade } from "../../context/tradesContext/Types";
import { DEFAULT_SPREAD } from "../painter/Constants";
import { ProcessOrdersParameters } from "./Types";

export default function processOrders({ orders, trades, currentCandle, balance }: ProcessOrdersParameters): number {
  const limitAndStopOrders = orders.filter((o) => o.type !== "market");
  for (const order of limitAndStopOrders) {
    let checkPrice: number;
    if (order.position === "long") {
      if (order.type === "buy-limit") {
        checkPrice = order.price - DEFAULT_SPREAD / 2;
      } else {
        checkPrice = order.price + DEFAULT_SPREAD / 2;
      }
    } else {
      if (order.type === "sell-limit") {
        checkPrice = order.price + DEFAULT_SPREAD / 2;
      } else {
        checkPrice = order.price - DEFAULT_SPREAD / 2;
      }
    }

    if (checkPrice >= currentCandle.low && checkPrice <= currentCandle.high) {
      if (order.type === "buy-stop") {
        order.price += DEFAULT_SPREAD;
        order.stopLoss = order.stopLoss ? order.stopLoss + DEFAULT_SPREAD : order.stopLoss;
        order.takeProfit = order.takeProfit ? order.takeProfit + DEFAULT_SPREAD : order.takeProfit;
      }
      if (order.type === "sell-stop") {
        order.price -= DEFAULT_SPREAD;
        order.stopLoss = order.stopLoss ? order.stopLoss - DEFAULT_SPREAD : order.stopLoss;
        order.takeProfit = order.takeProfit ? order.takeProfit - DEFAULT_SPREAD : order.takeProfit;
      }
      order.createdAt = currentCandle.timestamp;
      order.fillDate = currentCandle.timestamp;
      order.type = "market";
    }
  }

  const marketOrders = orders.filter((o) => o.type === "market");
  const indicesOfMarketOrdersToRemove: number[] = [];
  for (const [index, order] of marketOrders.entries()) {
    /**
      if currentCandle.timestamp === order.createdAt! {
        pedazo vela
        Si la vela es positiva y la positon es long , es una ganancia (si llega al TP claro)

      }
     */
    if ((!order.stopLoss && !order.takeProfit) || currentCandle.timestamp === order.createdAt!) continue;

    let trade: Trade;
    if (order.stopLoss) {
      const slRealPrice =
        order.position === "long" ? order.stopLoss - DEFAULT_SPREAD / 2 : order.stopLoss + DEFAULT_SPREAD / 2;
      if (slRealPrice >= currentCandle.low && slRealPrice <= currentCandle.high) {
        const spreadAdjustment = order.position === "short" ? DEFAULT_SPREAD : -DEFAULT_SPREAD;
        const endPrice = order.stopLoss + spreadAdjustment;
        trade = {
          startDate: order.createdAt!,
          endDate: currentCandle.timestamp,
          startPrice: order.price,
          endPrice,
          size: order.size,
          position: order.position,
          result: (endPrice - order.price) * order.size,
        };
        trades.push(trade);
        indicesOfMarketOrdersToRemove.push(index);

        if (trade.position === "short") trade.result = -trade.result;
        balance = balance + trade.result;
        continue;
      }
    }

    if (order.takeProfit) {
      const tpRealPrice =
        order.position === "short" ? order.takeProfit - DEFAULT_SPREAD / 2 : order.takeProfit + DEFAULT_SPREAD / 2;
      if (tpRealPrice >= currentCandle.low && tpRealPrice <= currentCandle.high) {
        trade = {
          startDate: order.createdAt!,
          endDate: currentCandle.timestamp,
          startPrice: order.price,
          endPrice: order.takeProfit,
          size: order.size,
          position: order.position,
          result: (order.takeProfit - order.price) * order.size,
        };
        trades.push(trade);
        indicesOfMarketOrdersToRemove.push(index);

        if (trade.position === "short") trade.result = -trade.result;
        balance = balance + trade.result;
        continue;
      }
    }
  }

  for (const i of indicesOfMarketOrdersToRemove) {
    orders.splice(i, 1);
  }

  return balance;
}
