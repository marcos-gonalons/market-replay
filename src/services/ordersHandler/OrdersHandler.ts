import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";
import { DEFAULT_SPREAD } from "../painter/Constants";
import { ProcessOrdersParameters } from "./Types";

export default function processOrders({ orders, trades, currentCandle, balance }: ProcessOrdersParameters): number {
  for (const order of orders.filter((o) => o.type !== "market")) {
    if (isPriceWithinCandle(getOrderPriceTakingSpreadIntoAccount(order), currentCandle)) {
      transformOrderIntoAMarketOrder(order);
    }
  }

  const indicesOfMarketOrdersToRemove: number[] = [];
  for (const [index, order] of orders.filter((o) => o.type === "market").entries()) {
    if (!order.stopLoss && !order.takeProfit) continue;

    const [slRealPrice, tpRealPrice] = getBracketPricesTakingSpreadIntoAccount(order);
    const orderCreatedInCurrentCandle = currentCandle.timestamp === order.createdAt!;

    if (order.stopLoss && order.takeProfit && orderCreatedInCurrentCandle) {
      if (isPriceWithinCandle(slRealPrice, currentCandle) && isPriceWithinCandle(tpRealPrice, currentCandle)) {
        randomizeTradeResult(order, index);
        continue;
      }
    }

    if (orderCreatedInCurrentCandle) continue;

    if (shouldProcessStopLoss(slRealPrice, order, currentCandle)) {
      processStopLossTrade(order, index);
      continue;
    }

    if (shouldProcessTakeProfit(tpRealPrice, order, currentCandle)) {
      processTakeProfitTrade(order, index);
      continue;
    }
  }

  for (const i of indicesOfMarketOrdersToRemove) {
    orders.splice(i, 1);
  }

  return balance;

  function getOrderPriceTakingSpreadIntoAccount(order: Order): number {
    switch (order.type) {
      case "buy-limit":
      case "sell-stop":
        return order.price - DEFAULT_SPREAD / 2;
      case "buy-stop":
      case "sell-limit":
        return order.price + DEFAULT_SPREAD / 2;
    }
    return order.price;
  }

  function transformOrderIntoAMarketOrder(order: Order): void {
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

  function getBracketPricesTakingSpreadIntoAccount(order: Order): number[] {
    let slRealPrice = 0;
    let tpRealPrice = 0;
    if (order.stopLoss) {
      slRealPrice =
        order.position === "long" ? order.stopLoss - DEFAULT_SPREAD / 2 : order.stopLoss + DEFAULT_SPREAD / 2;
    }
    if (order.takeProfit) {
      tpRealPrice =
        order.position === "short" ? order.takeProfit - DEFAULT_SPREAD / 2 : order.takeProfit + DEFAULT_SPREAD / 2;
    }
    return [slRealPrice, tpRealPrice];
  }

  function isPriceWithinCandle(price: number, candle: Candle): boolean {
    return price >= candle.low && price <= candle.high;
  }

  function randomizeTradeResult(order: Order, orderIndex: number): void {
    const chance = 75;
    const random = Math.random() * 100;
    const isCandlePositive = currentCandle.close >= currentCandle.low;
    let isProfit = false;

    if (order.position === "long" && isCandlePositive && random <= chance) {
      isProfit = true;
    }
    if (order.position === "short" && isCandlePositive && random >= chance) {
      isProfit = true;
    }
    if (order.position === "long" && !isCandlePositive && random >= chance) {
      isProfit = true;
    }
    if (order.position === "short" && !isCandlePositive && random <= chance) {
      isProfit = true;
    }

    if (isProfit) {
      processTakeProfitTrade(order, orderIndex);
    } else {
      processStopLossTrade(order, orderIndex);
    }
  }

  function shouldProcessStopLoss(slRealPrice: number, order: Order, currentCandle: Candle): boolean {
    return (
      order.stopLoss !== undefined &&
      order.stopLoss !== null &&
      !isNaN(order.stopLoss) &&
      ((slRealPrice >= currentCandle.low && slRealPrice <= currentCandle.high) ||
        (order.position === "short" && currentCandle.low > slRealPrice) ||
        (order.position === "long" && currentCandle.high < slRealPrice))
    );
  }

  function shouldProcessTakeProfit(tpRealPrice: number, order: Order, currentCandle: Candle): boolean {
    return (
      order.takeProfit !== undefined &&
      order.takeProfit !== null &&
      !isNaN(order.takeProfit) &&
      ((tpRealPrice >= currentCandle.low && tpRealPrice <= currentCandle.high) ||
        (order.position === "long" && currentCandle.low > tpRealPrice) ||
        (order.position === "short" && currentCandle.high < tpRealPrice))
    );
  }

  function processTakeProfitTrade(order: Order, orderIndex: number): void {
    const trade = {
      startDate: order.createdAt!,
      endDate: currentCandle.timestamp,
      startPrice: order.price,
      endPrice: order.takeProfit!,
      size: order.size,
      position: order.position,
      result: (order.takeProfit! - order.price) * order.size,
    };

    trades.push(trade);
    indicesOfMarketOrdersToRemove.push(orderIndex);

    if (trade.position === "short") trade.result = -trade.result;
    balance = balance + trade.result;
  }

  function processStopLossTrade(order: Order, orderIndex: number): void {
    const spreadAdjustment = order.position === "short" ? DEFAULT_SPREAD : -DEFAULT_SPREAD;
    const endPrice = order.stopLoss! + spreadAdjustment;
    const trade = {
      startDate: order.createdAt!,
      endDate: currentCandle.timestamp,
      startPrice: order.price,
      endPrice,
      size: order.size,
      position: order.position,
      result: (endPrice - order.price) * order.size,
    };

    trades.push(trade);
    indicesOfMarketOrdersToRemove.push(orderIndex);

    if (trade.position === "short") trade.result = -trade.result;
    balance = balance + trade.result;
  }
}
