import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";
import { getMinutesAsHalfAnHour } from "../../utils/Utils";
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

    if (!isMarketOrderExecutable(order, new Date(order.createdAt!))) {
      indicesOfMarketOrdersToRemove.push(index);
      continue;
    }

    if (orderCreatedInCurrentCandle) {
      if (order.stopLoss && order.takeProfit) {
        if (isPriceWithinCandle(slRealPrice, currentCandle) && isPriceWithinCandle(tpRealPrice, currentCandle)) {
          randomizeTradeResult(order, index);
          continue;
        }
      }

      if (order.takeProfit && isPriceWithinCandle(tpRealPrice, currentCandle)) {
        if (
          (order.position === "long" && currentCandle.close > currentCandle.open) ||
          (order.position === "short" && currentCandle.close < currentCandle.open)
        ) {
          processTakeProfitTrade(order, index);
        }
      }

      if (order.stopLoss && isPriceWithinCandle(slRealPrice, currentCandle)) {
        if (
          (order.position === "long" && currentCandle.close < currentCandle.open) ||
          (order.position === "short" && currentCandle.close > currentCandle.open)
        ) {
          processStopLossTrade(order, index, order.stopLoss);
        }
      }
      continue;
    }

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
        return order.price - spread / 2;
      case "buy-stop":
      case "sell-limit":
        return order.price + spread / 2;
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
        order.price += spread / 1.2;
        order.stopLoss = order.stopLoss ? order.stopLoss + spread : order.stopLoss;
        order.takeProfit = order.takeProfit ? order.takeProfit + spread : order.takeProfit;
      }
      if (order.type === "sell-stop") {
        order.price -= spread / 1.2;
        order.stopLoss = order.stopLoss ? order.stopLoss - spread : order.stopLoss;
        order.takeProfit = order.takeProfit ? order.takeProfit - spread : order.takeProfit;
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

  function isMarketOrderExecutable(order: Order, date: Date): boolean {
    if (order.executeHours) {
      const executableHours = order.executeHours.map((t) => t.hour);
      if (!executableHours) return true;

      const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
      if (!executableHours.includes(hour)) return false;

      const executableWeekdays = order.executeHours.find((t) => t.hour === hour)!.weekdays;
      if (!executableWeekdays || executableWeekdays.length === 0) return true;

      if (!executableWeekdays.includes(date.getDay())) return false;
      return true;
    }

    if (order.executeDays) {
      const executableDays = order.executeDays.map((d) => d.weekday);
      if (!executableDays) return true;

      const weekday = date.getDay();
      if (!executableDays.includes(weekday)) return false;

      const executableHours = order.executeDays.find((d) => d.weekday === weekday)!.hours;
      if (!executableHours || executableHours.length === 0) return true;

      const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
      if (!executableHours.includes(hour)) return false;

      return true;
    }

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

    console.log("profit", trade);

    trades.push(trade);
    indicesOfMarketOrdersToRemove.push(orderIndex);

    if (trade.position === "short") trade.result = -trade.result;
  }

  function processStopLossTrade(order: Order, orderIndex: number, price: number): void {
    const spreadAdjustment = order.position === "short" ? spread : -spread;
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

    console.log("loss", trade);

    trades.push(trade);
    indicesOfMarketOrdersToRemove.push(orderIndex);

    if (trade.position === "short") trade.result = -trade.result;
  }
}
