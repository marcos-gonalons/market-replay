import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";

export interface ScriptFuncParameters {
  candles: Candle[];
  orders: Order[];
  persistedVars: { [key: string]: unknown };
  balance: number;
  currentDataIndex: number;
  createOrder: (order: Order) => string;
  removeAllOrders: () => void;
  closeOrder: (orderId: string) => void;

  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  drawings?: (() => void)[];
}
