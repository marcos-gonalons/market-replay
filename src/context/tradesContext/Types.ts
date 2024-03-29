import { Dispatch } from "react";
import { ReducerAction } from "../Types";

type OrderType = "market" | "buy-limit" | "buy-stop" | "sell-limit" | "sell-stop";

type Position = "long" | "short";

interface Order {
  id?: string;
  type: OrderType;
  position: Position;
  size: number;
  price: number;
  createdAt?: number;
  stopLoss?: number;
  takeProfit?: number;
  fillDate?: number;
  rollover?: number;
  metadata?: unknown;
}

interface Trade {
  startDate: number;
  endDate: number;
  startPrice: number;
  endPrice: number;
  size: number;
  position: Position;
  result: number;
}

interface State {
  readonly orders: Order[];
  readonly trades: Trade[];
  readonly balance: number;
}

interface TradesContext {
  state: State;
  dispatch: Dispatch<ReducerAction>;
}

const ActionTypes = {
  ADD_ORDER: "TRADES_CONTEXT_ADD_ORDER",
  ADD_TRADE: "TRADES_CONTEXT_ADD_TRADE",
  REMOVE_ALL_ORDERS: "TRADES_CONTEXT_REMOVE_ALL_ORDERS",
  REMOVE_ALL_TRADES: "TRADES_CONTEXT_REMOVE_ALL_TRADES",
  SET_ORDERS: "TRADES_CONTEXT_SET_ORDERS",
  SET_TRADES: "TRADES_CONTEXT_SET_TRADES",
  SET_BALANCE: "TRADES_CONTEXT_SET_BALANCE",
  REMOVE_ORDER: "TRADES_CONTEXT_REMOVE_ORDER",
};

export { ActionTypes };
export type { State, Order, Trade, Position, OrderType, TradesContext };
