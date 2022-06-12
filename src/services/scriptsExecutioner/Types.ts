import { Candle } from "../../context/globalContext/Types";
import { Order, Trade } from "../../context/tradesContext/Types";

export interface StrategyFuncParameters {
  candles: Candle[];
  orders: Order[];
  trades: Trade[];
  persistedVars: { [key: string]: unknown };
  balance: number;
  currentDataIndex: number;
  spread: number;
  params?: StrategyParams;
  createOrder: (order: Order) => string;
  removeAllOrders?: () => void;
  closeOrder: (orderId: string) => void;
  isWithinTime: (
    executeHours: {
      hour: string;
      weekdays?: number[];
    }[],
    executeDays: {
      weekday: number;
      hours: string[];
    }[],
    executeMonths: number[],
    date: Date
  ) => boolean;

  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  drawings?: (() => void)[];
  debugLog: (enabled: boolean, ...msgs: unknown[]) => void;
  strategies: Strategy[];
}

export interface StrategyParams {
  validHours?: {
    hour: string;
    weekdays: number[];
  }[];
  validDays?: {
    weekday: number;
    hours: string[];
  }[];
  validMonths?: number[];
  riskPercentage: number;
  stopLossDistance: number;
  takeProfitDistance: number;
  tpDistanceShortForTighterSL: number;
  trendCandles: number;
  trendDiff: number;
  slDistanceWhenTpIsVeryClose: number;
  candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: number;
  priceOffset: number;
  maxSecondsOpenTrade?: number;

  profits?: number;
  totalTrades?: number;

  extraTrade?: {
    stopLossDistance: number;
    takeProfitDistance: number;
    tpDistanceShortForTighterSL: number;
  };

  withPendingOrders?: boolean;
}

export interface Strategy {
  name: string;
  func: ({
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
    debugLog
  }: StrategyFuncParameters) => void;
}
