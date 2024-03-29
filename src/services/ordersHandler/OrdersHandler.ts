import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";
import { addCommissions, adjustTradeResultWithRollover } from "../../utils/Utils";
import { EUR_EXCHANGE_RATE, STOP_ORDER_POINTS_HANDICAP } from "../painter/Constants";
import { ProcessOrdersParameters } from "./Types";

export default function processOrders({
  orders,
  trades,
  currentCandle,
  previousCandle,
  spread,
}: ProcessOrdersParameters): void {
  for (const order of orders.filter((o) => o.type !== "market")) {
    const spreadedOrderPrice = getOrderPriceTakingSpreadIntoAccount(order);
    if (isPriceWithinCandle(spreadedOrderPrice, currentCandle)) {
      transformOrderIntoAMarketOrder(order, order.price);
    } else if (gapHasOvercomePrice(spreadedOrderPrice, currentCandle, previousCandle)) {
      transformOrderIntoAMarketOrder(order, currentCandle.open);
    }
  }

  const indicesOfMarketOrdersToRemove: number[] = [];
  for (const [index, order] of orders.filter((o) => o.type === "market").entries()) {
    if (!order.stopLoss && !order.takeProfit) continue;

    const [slRealPrice, tpRealPrice] = getBracketPricesTakingSpreadIntoAccount(order);
    const orderCreatedInCurrentCandle = currentCandle.timestamp === order.createdAt!;
    const orderCreatedInPreviousCandle = previousCandle!.timestamp === order.createdAt!;

    if (orderCreatedInCurrentCandle || orderCreatedInPreviousCandle) {
      if (order.stopLoss && order.takeProfit) {
        if (isPriceWithinCandle(slRealPrice, currentCandle) && isPriceWithinCandle(tpRealPrice, currentCandle)) {
          indicesOfMarketOrdersToRemove.push(index);
          randomizeTradeResult(order, index);
          continue;
        }
      }

      if (order.takeProfit && isPriceWithinCandle(tpRealPrice, currentCandle)) {
          processTakeProfitTrade(order, index);
      }

      if (order.stopLoss && isPriceWithinCandle(slRealPrice, currentCandle)) {
          processStopLossTrade(order, index, order.stopLoss);
      }
      continue;
    }

    if (order.stopLoss) {
      if (isPriceWithinCandle(slRealPrice, currentCandle) || (
        (order.position === "long" && currentCandle.low <= slRealPrice) ||
        (order.position === "short" && currentCandle.high >= slRealPrice)
      )) {
        processStopLossTrade(order, index, order.stopLoss!);
        continue;
      } else if (gapHasOvercomePrice(slRealPrice, currentCandle, previousCandle)) {
        processStopLossTrade(order, index, currentCandle.open);
        continue;
      }
    }

    if (order.takeProfit) {
      if (
        isPriceWithinCandle(tpRealPrice, currentCandle) ||
        gapHasOvercomePrice(tpRealPrice, currentCandle, previousCandle) || 
        (
          (order.position === "long" && currentCandle.high >= tpRealPrice) ||
          (order.position === "short" && currentCandle.low <= tpRealPrice)
        )
      ) {
        processTakeProfitTrade(order, index);
        continue;
      }
    }
  }

  for (const i of indicesOfMarketOrdersToRemove) {
    orders.splice(i, 1);
  }

  function getOrderPriceTakingSpreadIntoAccount(order: Order): number {
    switch (order.type) {
      case "buy-limit":
      case "sell-stop":
        return order.price - spread / 2;
      case "buy-stop":
      case "sell-limit":
        return order.price + spread / 2;
    }
    return order.price;
  }

  function transformOrderIntoAMarketOrder(order: Order, fillPrice: number): void {
    if (order.type === "buy-stop" || order.type === "sell-stop") {
      order.price = fillPrice;

      if (order.type === "buy-stop") {
        order.price += STOP_ORDER_POINTS_HANDICAP;
      }
      if (order.type === "sell-stop") {
        order.price -= STOP_ORDER_POINTS_HANDICAP;
      }
    }

    order.createdAt = currentCandle.timestamp;
    order.fillDate = currentCandle.timestamp;
    order.type = "market";
  }

  function getBracketPricesTakingSpreadIntoAccount(order: Order): number[] {
    let slRealPrice = 0;
    let tpRealPrice = 0;
    if (order.stopLoss) {
      slRealPrice = order.position === "long" ? order.stopLoss - spread / 2 : order.stopLoss + spread / 2;
    }
    if (order.takeProfit) {
      tpRealPrice = order.position === "short" ? order.takeProfit - spread / 2 : order.takeProfit + spread / 2;
    }
    return [slRealPrice, tpRealPrice];
  }

  function isPriceWithinCandle(price: number, candle: Candle): boolean {
    return price >= candle.low && price <= candle.high;
  }

  function gapHasOvercomePrice(price: number, currentCandle: Candle, previousCandle: Candle | null): boolean {
    if (previousCandle) {
      return (
        (currentCandle.low > price && previousCandle.high < price) ||
        (currentCandle.high < price && previousCandle.low > price)
      );
    }
    return false;
  }

  function randomizeTradeResult(order: Order, orderIndex: number): void {
    const chance = 0;
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
      processStopLossTrade(order, orderIndex, order.stopLoss!);
    }
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

    adjustTradeResultWithRollover(trade, order.rollover || 0);
    addCommissions(trade);

    trade.result *= EUR_EXCHANGE_RATE;
  }

  function processStopLossTrade(order: Order, orderIndex: number, price: number): void {
    const spreadAdjustment = order.position === "short" ? STOP_ORDER_POINTS_HANDICAP : -STOP_ORDER_POINTS_HANDICAP;
    const endPrice = price + spreadAdjustment;
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

    adjustTradeResultWithRollover(trade, order.rollover || 0);
    addCommissions(trade);

    trade.result *= EUR_EXCHANGE_RATE;
  }
}
