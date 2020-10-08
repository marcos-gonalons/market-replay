import { ReducerAction } from "../Types";
import { ActionTypes, Order, Trade } from "./Types";

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
