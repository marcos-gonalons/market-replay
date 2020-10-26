import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";
import { getMinutesAsHalfAnHour } from "../../utils/Utils";
import { DEFAULT_SPREAD } from "../painter/Constants";
import { ProcessOrdersParameters } from "./Types";

export default function processOrders({
  orders,
  trades,
  currentCandle,
  previousCandle,
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

    if (!isOrderExecutable(order, new Date(order.createdAt!))) {
      indicesOfMarketOrdersToRemove.push(index);
      continue;
    }

    if (order.stopLoss && order.takeProfit && orderCreatedInCurrentCandle) {
      if (isPriceWithinCandle(slRealPrice, currentCandle) && isPriceWithinCandle(tpRealPrice, currentCandle)) {
        randomizeTradeResult(order, index);
        continue;
      }
    }

    if (orderCreatedInCurrentCandle) continue;

    if (order.stopLoss) {
      if (isPriceWithinCandle(slRealPrice, currentCandle)) {
        processStopLossTrade(order, index, order.stopLoss!);
      } else if (gapHasOvercomePrice(slRealPrice, currentCandle, previousCandle)) {
        processStopLossTrade(order, index, currentCandle.open);
      }
    }

    if (order.takeProfit) {
      if (
        isPriceWithinCandle(tpRealPrice, currentCandle) ||
        gapHasOvercomePrice(tpRealPrice, currentCandle, previousCandle)
      ) {
        processTakeProfitTrade(order, index);
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
        return order.price - DEFAULT_SPREAD / 2;
      case "buy-stop":
      case "sell-limit":
        return order.price + DEFAULT_SPREAD / 2;
    }
    return order.price;
  }

  function transformOrderIntoAMarketOrder(order: Order, fillPrice: number): void {
    const slDistance = order.stopLoss ? Math.abs(order.price - order.stopLoss) : 0;
    const tpDistance = order.takeProfit ? Math.abs(order.price - order.takeProfit) : 0;

    if (order.type === "buy-stop" || order.type === "sell-stop") {
      order.price = fillPrice;

      if (tpDistance) {
        if (order.position === "long") {
          order.takeProfit = fillPrice + tpDistance;
        } else {
          order.takeProfit = fillPrice - tpDistance;
        }
      }
      if (slDistance) {
        if (order.position === "long") {
          order.stopLoss = fillPrice - slDistance;
        } else {
          order.stopLoss = fillPrice + slDistance;
        }
      }

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

  function isOrderExecutable(order: Order, date: Date): boolean {
    if (!order.executeTime) return true;

    const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
    const executableHours = order.executeTime.map((t) => t.hour);

    if (!executableHours.includes(hour)) return false;

    const executableWeekdays = order.executeTime.find((t) => t.hour === hour)!.weekdays;

    if (!executableWeekdays.includes(date.getDay())) return false;

    return true;
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
  }

  function processStopLossTrade(order: Order, orderIndex: number, price: number): void {
    const spreadAdjustment = order.position === "short" ? DEFAULT_SPREAD : -DEFAULT_SPREAD;
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
  }
}
