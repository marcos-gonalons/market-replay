import { StrategyFuncParameters } from "../../../../services/scriptsExecutioner/Types";
import { handle as HandleTrailingSLAndTP } from "../common/HandleTrailingSLAndTP";
import { get as GetRange, getAverages } from "../common/Ranges/GetRange";
import { Order, OrderType, Position } from "../../../tradesContext/Types";
import { Candle, MovingAverage } from "../../../globalContext/Types";

export function Strategy({
  candles,
  orders,
  trades,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
  debugLog,
}: StrategyFuncParameters) {
  const ENABLE_DEBUG = true;

  void persistedVars;
  void trades;
  void spread;
  void createOrder;

  const currentCandle = candles[currentDataIndex];
  const date = new Date(currentCandle.timestamp);

  if (!isWithinTime([], [], params!.validMonths || [], date) || !isWithinTime([], params!.validDays || [], [], date)) {
    return;
  }
  const isValidTime = isWithinTime(params!.validHours || [], params!.validDays || [], params!.validMonths || [], date);
  void isValidTime;

  if (balance < 0) {
    balance = 1;
  }
  if (candles.length <= 1 || currentDataIndex === 0) return;

  const openPosition = orders.find((o) => o.type === "market");

  if (openPosition && params!.maxSecondsOpenTrade) {
    const diffInSeconds = Math.floor((date.valueOf() - openPosition.createdAt!.valueOf()) / 1000);

    if (diffInSeconds >= params!.maxSecondsOpenTrade) {
      debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, openPosition);
      closeOrder(openPosition.id!);
    }
  }

  if (openPosition?.position === "short") {
    HandleTrailingSLAndTP({
      openPosition,
      trailingSL: params!.trailingSL!,
      trailingTP: params!.trailingTP!,
      currentCandle,
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });
  }

  if (params!.ranges!.trendyOnly) {
    if (currentCandle.open >= getEMA(currentCandle, 21).value) {
      debugLog(ENABLE_DEBUG, "Price is above huge EMA, not opening any shorts just yet ...", currentCandle, date);
      return;
    }
  }

  const range = GetRange({
    candles,
    currentCandle,
    currentDataIndex,
    strategyParams: params!
  });

  if (!range) return;
  range.map(l => l.candle.meta = { type: l.type });

  if (openPosition) {
    debugLog(ENABLE_DEBUG, "There is an open position - doing nothing ...", date, openPosition);
    return;
  }

  const [resistancesAvg, supportsAvg] = getAverages(range);
  
  let type: OrderType = params!.ranges!.orderType;
  let position: Position = "short";
  let price: number = 0;

  if (type === "sell-limit") {
    price = resistancesAvg + params!.ranges!.priceOffset;

    if (currentCandle.close >= price) {
      return;
    }
  } else if (type === "sell-stop") {
    price = supportsAvg + params!.ranges!.priceOffset;

    if (price >= currentCandle.close) {
      return;
    }
  } else if (type === "market") {
    price = currentCandle.close;
  }

  let stopLoss: number = getStopLoss();
  if (stopLoss <= price) {
    return;
  }

  let takeProfit: number = getTakeProfit();
  if (takeProfit >= price) {
    return;
  }

  const size = 10000;
  const rollover = (0.7 * size) / 10000;
  const order: Order = {
    type: type!,
    position: position!,
    price,
    size,
    rollover,
    takeProfit,
    stopLoss
  }

  const existingOrderAtSamePrice = orders.find(o => 
    o.type !== "market" &&
    o.price === price &&
    o.position === "short"
  );
  if (existingOrderAtSamePrice) {
    return;
  }

  orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
  createOrder(order);

  function getStopLoss(): number {
    let sl: number;
    switch (params!.ranges!.stopLossStrategy) {
      case "half":
        sl = (resistancesAvg + supportsAvg) / 2;
        break;
      case "level":
        sl = type === "sell-stop" ? resistancesAvg : supportsAvg;
        break;
      case "levelWithOffset":
        let avg = type === "sell-stop" ? resistancesAvg : supportsAvg;
        sl = avg + (params!.stopLossDistance || 0)
        break;
      case "distance":
        sl = price + params!.stopLossDistance!;
        break;
    }
    if (sl - price > params!.maxStopLossDistance!) {
      sl = price + params!.maxStopLossDistance!;
    }

    return sl;
  }

  function getTakeProfit(): number {
    switch (params!.ranges!.takeProfitStrategy) {
      case "half":
        return (resistancesAvg + supportsAvg) / 2;
      case "level":
        return supportsAvg;
      case "levelWithOffset":
        return supportsAvg - (params!.takeProfitDistance || 0)
      case "distance":
        return price - params!.takeProfitDistance!;
    }
  }
}

function getEMA(candle: Candle, candlesAmount: number): MovingAverage {
  return candle.indicators.movingAverages.find(m => m.candlesAmount === candlesAmount)!;
}

