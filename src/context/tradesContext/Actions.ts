import { ReducerAction } from "../Types";
import { ActionTypes, Order, Trade } from "./Types";

export function removeAllOrders(): ReducerAction {
  return {
    type: ActionTypes.REMOVE_ALL_ORDERS,
  };
}

export function removeAllTrades(): ReducerAction {
  return {
    type: ActionTypes.REMOVE_ALL_TRADES,
  };
}

export function addOrder(payload: Order): ReducerAction {
  return {
    type: ActionTypes.ADD_ORDER,
    payload,
  };
}

export function addTrade(payload: Trade): ReducerAction {
  return {
    type: ActionTypes.ADD_TRADE,
    payload,
  };
}

export function setOrders(payload: Order[]): ReducerAction {
  return {
    type: ActionTypes.SET_ORDERS,
    payload,
  };
}

export function setTrades(payload: Trade[]): ReducerAction {
  return {
    type: ActionTypes.SET_TRADES,
    payload,
  };
}

export function setBalance(payload: number): ReducerAction {
  return {
    type: ActionTypes.SET_BALANCE,
    payload,
  };
}
