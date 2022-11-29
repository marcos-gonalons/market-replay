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
  closeOrder: (orderId: string, openOrClose?: 'open'|'close') => void;
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
  minStopLossDistance?: number;
  maxStopLossDistance?: number;
  stopLossDistance?: number;
  takeProfitDistance?: number;

  trailingSL?: {
    tpDistanceShortForTighterSL: number;
    slDistanceWhenTpIsVeryClose: number;
  };

  trailingTP?: {
    slDistanceShortForTighterTP: number;
    tpDistanceWhenSlIsVeryClose: number;
  };

  minProfit?: number;
  
  trendCandles?: number;
  trendDiff?: number;
  candlesAmountToBeConsideredHorizontalLevel?: {
    future: number;
    past: number;
  };

  candlesAmountWithoutEMAsCrossing?: number;

  priceOffset?: number;
  maxAttemptsToGetSL?: number;
  maxSecondsOpenTrade?: number;

  profits?: number;
  totalTrades?: number;
  withPendingOrders?: boolean;
}

type StrategyName = (
  "Resistance Breakout" | "Support Breakout" | "Resistance Bounce" | "Support Bounce" |
  "EMA Crossover Longs" | "EMA Crossover Shorts"
)
export interface Strategy {
  name: StrategyName;
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
