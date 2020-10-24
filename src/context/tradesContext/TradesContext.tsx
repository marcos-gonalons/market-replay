import React, { useReducer, createContext } from "react";
import { ReducerAction } from "../Types";
import { ActionTypes, Order, State, Trade, TradesContext as TradesContextType } from "./Types";

const initialState: State = {
  orders: [],
  trades: [],
  balance: 10000,
};

export const TradesContext = createContext<TradesContextType>({
  state: initialState,
  dispatch: () => null,
});

const reducer = (state: State, action: ReducerAction): State => {
  let ordersCopy: State["orders"];
  let tradesCopy: State["trades"];
  let id: string;
  switch (action.type) {
    case ActionTypes.ADD_ORDER:
      ordersCopy = JSON.parse(JSON.stringify(state.orders));
      ordersCopy.push(action.payload as Order);
      return {
        ...state,
        orders: ordersCopy,
      };
    case ActionTypes.ADD_TRADE:
      tradesCopy = JSON.parse(JSON.stringify(state.trades));
      tradesCopy.push(action.payload as Trade);
      return {
        ...state,
        trades: tradesCopy,
      };
    case ActionTypes.REMOVE_ALL_ORDERS:
      return {
        ...state,
        orders: [],
      };
    case ActionTypes.REMOVE_ALL_TRADES:
      return {
        ...state,
        trades: [],
      };
    case ActionTypes.SET_ORDERS:
      return {
        ...state,
        orders: action.payload as State["orders"],
      };
    case ActionTypes.SET_TRADES:
      return {
        ...state,
        trades: action.payload as State["trades"],
      };
    case ActionTypes.SET_BALANCE:
      return {
        ...state,
        balance: action.payload as State["balance"],
      };
    case ActionTypes.REMOVE_ORDER:
      id = action.payload as string;
      ordersCopy = JSON.parse(JSON.stringify(state.orders));
      ordersCopy.splice(
        ordersCopy.findIndex((o) => id === o.id),
        1
      );
      return {
        ...state,
        orders: ordersCopy,
      };
    default:
      return state;
  }
};

export const TradesContextProvider: React.FC = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <TradesContext.Provider value={{ state, dispatch }}>{children}</TradesContext.Provider>;
};

export { reducer, initialState };
