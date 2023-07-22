import { StrategyFuncParameters } from "../../../../services/scriptsExecutioner/Types";
import { handle as HandleTrailingSLAndTP } from "../common/HandleTrailingSLAndTP";
import { get as GetRange, getAverages } from "../common/GetRange";
import { Order, OrderType, Position } from "../../../tradesContext/Types";

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

  if (openPosition?.position === "long") {
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
  
  let type: OrderType = "sell-limit";
  let position: Position = "short";
  let price: number = resistancesAvg+params!.ranges!.limitPriceOffset;
  if (currentCandle.close > price) {
    return;
  }
  let stopLoss: number = price + params!.stopLossDistance!;
  let takeProfit: number;
  switch (params!.ranges!.takeProfitStrategy) {
    case "half":
      takeProfit = (resistancesAvg + supportsAvg) / 2;
      break;
    case "level":
      takeProfit = supportsAvg;
      break;
    case "levelWithOffset":
      takeProfit = supportsAvg - (params!.takeProfitDistance || 0)
      break;
  }

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
    o.type === "sell-limit"
  );
  if (existingOrderAtSamePrice) {
    return;
  }

  range.map(l => debugLog(ENABLE_DEBUG, l.type, new Date(l.candle.timestamp)));
  orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));
  createOrder(order);

}
