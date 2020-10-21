import { Trade } from "../../context/tradesContext/Types";
import { ProcessOrdersParameters } from "./Types";

export default function processOrders({ orders, trades, currentCandle, balance }: ProcessOrdersParameters): number {
  const limitOrders = orders.filter((o) => o.type === "limit");
  for (const order of limitOrders) {
    if (order.price >= currentCandle.low && order.price <= currentCandle.high) {
      order.createdAt = currentCandle.timestamp;
      order.fillDate = currentCandle.timestamp;
      order.type = "market";
    }
  }

  const marketOrders = orders.filter((o) => o.type === "market");
  const indicesOfMarketOrdersToRemove: number[] = [];
  for (const [index, order] of marketOrders.entries()) {
    if (!order.stopLoss && !order.takeProfit) continue;
    let trade: Trade;

    if (
      order.stopLoss &&
      order.stopLoss >= currentCandle.low &&
      order.stopLoss <= currentCandle.high &&
      currentCandle.timestamp > order.createdAt!
    ) {
      trade = {
        startDate: order.createdAt!,
        endDate: currentCandle.timestamp,
        startPrice: order.price,
        endPrice: order.stopLoss,
        size: order.size,
        position: order.position,
        result: (order.stopLoss - order.price) * order.size,
      };
      trades.push(trade);
      indicesOfMarketOrdersToRemove.push(index);

      if (trade.position === "short") trade.result = -trade.result;
      balance = balance + trade.result;
      continue;
    }

    if (
      order.takeProfit &&
      order.takeProfit >= currentCandle.low &&
      order.takeProfit <= currentCandle.high &&
      currentCandle.timestamp > order.createdAt!
    ) {
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

  for (const i of indicesOfMarketOrdersToRemove) {
    orders.splice(i, 1);
  }

  return balance;
}
