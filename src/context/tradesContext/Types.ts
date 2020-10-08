interface Order {
  type: "market" | "limit";
  price: number;
  size: number;
  stopLoss?: number;
  takeProfit?: number;
  fillDate?: Date;
}

interface Trade {
  startDate: Date;
  endDate: Date;
  startPrice: number;
  endPrice: number;
  size: number;
}

interface State {
  readonly orders: Order[];
  readonly trades: Trade[];
}

const ActionTypes = {
  ADD_ORDER: "TRADES_CONTEXT_ADD_ORDER",
  ADD_TRADE: "TRADES_CONTEXT_ADD_TRADE",
};

export { ActionTypes };
export type { State, Order, Trade };
