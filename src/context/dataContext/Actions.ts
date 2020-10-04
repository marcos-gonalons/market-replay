import { ReducerAction } from "../Types";
import { ActionTypes } from "./Types";

import { State } from "./Types";

export function setDataAction(data: State["data"]): ReducerAction {
  return {
    type: ActionTypes.SET_DATA,
    payload: data,
  };
}

export function setIsParsingDataAction(v: State["isParsingData"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_PARSING_DATA,
    payload: v,
  };
}
