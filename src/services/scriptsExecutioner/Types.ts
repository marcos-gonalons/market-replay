import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";

export interface ScriptFuncParameters {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  candles: Candle[];
  currentCandle: Candle;
  drawings: (() => void)[];
  orders: Order[];
  persistedVars: { [key: string]: unknown };
  balance: number;
  createOrder: (order: Order) => void;
  removeAllOrders: () => void;
}
