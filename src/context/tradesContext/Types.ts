type OrderType = "market" | "limit";

type Position = "long" | "short";

interface Order {
  type: OrderType;
  position: Position;
  size: number;
  price: number;
  createdAt: number;
  stopLoss?: number;
  takeProfit?: number;
  fillDate?: number;
}

interface Trade {
  startDate: number;
  endDate: number;
  startPrice: number;
  endPrice: number;
  size: number;
  position: Position;
}

interface State {
  readonly orders: Order[];
  readonly trades: Trade[];
}

const ActionTypes = {
  ADD_ORDER: "TRADES_CONTEXT_ADD_ORDER",
  ADD_TRADE: "TRADES_CONTEXT_ADD_TRADE",
  REMOVE_ALL_ORDERS: "TRADES_CONTEXT_REMOVE_ALL_ORDERS",
  SET_ORDERS: "TRADES_CONTEXT_SET_ORDERS",
};

export { ActionTypes };
export type { State, Order, Trade, Position, OrderType };
