import { Candle } from "../../context/globalContext/Types";
import { Order, Trade } from "../../context/tradesContext/Types";

export interface ScriptFuncParameters {
  candles: Candle[];
  orders: Order[];
  trades: Trade[];
  persistedVars: { [key: string]: unknown };
  balance: number;
  currentDataIndex: number;
  spreadAdjustment: number;
  params?: ScriptParams;
  createOrder: (order: Order) => string;
  removeAllOrders: () => void;
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
}

export interface ScriptParams {
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
  tpDistanceShortForBreakEvenSL: number;
  trendCandles: number;
  trendDiff: number;
  candlesAmountWithLowerPriceToBeConsideredHorizontalLevel: number;

  profits?: number;
  totalTrades?: number;

  extraTrade?: {
    stopLossDistance: number;
    takeProfitDistance: number;
    tpDistanceShortForBreakEvenSL: number;
  }
}
