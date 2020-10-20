import { Candle } from "../../context/globalContext/Types";
import { Order, Trade } from "../../context/tradesContext/Types";

export interface ProcessOrdersParameters {
  orders: Order[];
  trades: Trade[];
  currentCandle: Candle;
  balance: number;
}
