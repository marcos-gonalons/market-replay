import React, { useReducer, createContext, Dispatch } from "react";
import { ReducerAction } from "../Types";
import { ActionTypes, Order, State, Trade } from "./Types";

const initialState: State = {
  orders: [],
  trades: [],
  balance: 100000,
};

export const TradesContext = createContext<{
  state: State;
  dispatch: Dispatch<ReducerAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const reducer = (state: State, action: ReducerAction): State => {
  let ordersCopy: State["orders"];
  let tradesCopy: State["trades"];
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
    default:
      return state;
  }
};

export const TradesContextProvider: React.FC = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <TradesContext.Provider value={{ state, dispatch }}>{children}</TradesContext.Provider>;
};

export { reducer, initialState };
