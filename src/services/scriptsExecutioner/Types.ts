import { Candle } from "../../context/globalContext/Types";
import { Order } from "../../context/tradesContext/Types";
import PainterService from "../painter/Painter";

export interface ScriptFuncParameters {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  candles: Candle[];
  currentCandle: Candle;
  drawings: (() => void)[];
  orders: Order[];
  persistedVars: { [key: string]: unknown };
  painterService: PainterService;
  balance: number;
  createOrder: (order: Order) => number;
}
