import React, { useReducer, createContext, Dispatch } from "react";
import PainterService from "../../services/painter/Painter";
import ReplayerService from "../../services/replayer/Replayer";
import ScriptsExecutionerService from "../../services/scriptsExecutioner/ScriptsExecutioner";
import { ReducerAction } from "../Types";
import { ActionTypes, State } from "./Types";

const initialState: State = {
  painterService: null,
  replayerService: null,
  scriptsExecutionerService: null,
  data: [],
  isParsingData: false,
  isReplayWidgetVisible: false,
  isReplayActive: false,
  isTradingPanelVisible: false,
  isScriptsPanelVisible: false,
  // eslint-disable-next-line
  worker: new (require("worker-loader!../../worker/Worker.worker").default)(),
};

export const GlobalContext = createContext<{
  state: State;
  dispatch: Dispatch<ReducerAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const reducer = (state: State, action: ReducerAction): State => {
  switch (action.type) {
    case ActionTypes.SET_DATA:
      return {
        ...state,
        data: action.payload as State["data"],
      };

    case ActionTypes.SET_IS_PARSING_DATA:
      return {
        ...state,
        isParsingData: action.payload as State["isParsingData"],
      };

    case ActionTypes.SET_IS_REPLAY_WIDGET_VISIBLE:
      return {
        ...state,
        isReplayWidgetVisible: action.payload as State["isReplayWidgetVisible"],
      };

    case ActionTypes.SET_IS_TRADING_PANEL_VISIBLE:
      return {
        ...state,
        isTradingPanelVisible: action.payload as State["isTradingPanelVisible"],
      };

    case ActionTypes.SET_IS_REPLAY_ACTIVE:
      return {
        ...state,
        isReplayActive: action.payload as State["isReplayActive"],
      };

    case ActionTypes.SET_IS_SCRIPTS_PANEL_VISIBLE:
      return {
        ...state,
        isScriptsPanelVisible: action.payload as State["isScriptsPanelVisible"],
      };

    case ActionTypes.SET_SERVICES:
      const { painterService, replayerService, scriptsExecutionerService } = action.payload as {
        painterService: PainterService;
        replayerService: ReplayerService;
        scriptsExecutionerService: ScriptsExecutionerService;
      };
      return {
        ...state,
        painterService,
        replayerService,
        scriptsExecutionerService,
      };

    default:
      return state;
  }
};

export const GlobalContextProvider: React.FC = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <GlobalContext.Provider value={{ state, dispatch }}>{children}</GlobalContext.Provider>;
};

export { reducer, initialState };
