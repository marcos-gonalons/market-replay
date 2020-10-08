import { ReducerAction } from "../Types";
import { ActionTypes, Order, Trade } from "./Types";

export function removeAllOrders(): ReducerAction {
  return {
    type: ActionTypes.REMOVE_ALL_ORDERS,
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
