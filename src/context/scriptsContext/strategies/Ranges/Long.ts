import { StrategyFuncParameters } from "../../../../services/scriptsExecutioner/Types";

import { handle as HandleTrailingSLAndTP } from "../common/HandleTrailingSLAndTP";

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

  debugLog(ENABLE_DEBUG, "Params ", params);
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
      currentCandle: candles[currentDataIndex],
      log: (...msg: any[]) => {
        debugLog(ENABLE_DEBUG, date, ...msg)
      }
    });
  }

  if (openPosition) {
    debugLog(ENABLE_DEBUG, "There is an open position - doing nothing ...", date, openPosition);
    return;
  }

}
