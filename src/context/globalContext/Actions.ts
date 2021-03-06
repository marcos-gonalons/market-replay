import PainterService from "../../services/painter/Painter";
import ReplayerService from "../../services/replayer/Replayer";
import ScriptsExecutionerService from "../../services/scriptsExecutioner/ScriptsExecutioner";
import { ReducerAction } from "../Types";
import { ActionTypes } from "./Types";

import { State } from "./Types";

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

export function setIsReplayActive(payload: State["isReplayActive"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_REPLAY_ACTIVE,
    payload,
  };
}

export function setIsTradingPanelVisible(payload: State["isTradingPanelVisible"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_TRADING_PANEL_VISIBLE,
    payload,
  };
}

export function setIsScriptsPanelVisible(payload: State["isScriptsPanelVisible"]): ReducerAction {
  return {
    type: ActionTypes.SET_IS_SCRIPTS_PANEL_VISIBLE,
    payload,
  };
}

export function setServices(payload: {
  painterService: PainterService;
  replayerService: ReplayerService;
  scriptsExecutionerService: ScriptsExecutionerService;
}): ReducerAction {
  return {
    type: ActionTypes.SET_SERVICES,
    payload,
  };
}
