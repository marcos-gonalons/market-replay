import { ReducerAction } from "../Types";
import { ActionTypes } from "./Types";

import { State } from "./Types";

export function setPainterService(payload: State["painterService"]): ReducerAction {
  return {
    type: ActionTypes.SET_PAINTER_SERVICE,
    payload,
  };
}

export function setDataAction(payload: State["data"]): ReducerAction {
  return {
    type: ActionTypes.SET_DATA,
    payload,
  };
}

export function setIsParsingDataAction(payload: State["isParsingData"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_PARSING_DATA,
    payload,
  };
}

export function setIsReplayWidgetVisible(payload: State["isReplayWidgetVisible"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_REPLAY_WIDGET_VISIBLE,
    payload,
  };
}

export function setIsTradingPanelVisible(payload: State["isTradingPanelVisible"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_TRADING_PANEL_VISIBLE,
    payload,
  };
}
