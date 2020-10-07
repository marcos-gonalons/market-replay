import React, { useReducer, createContext, Dispatch } from "react";
import PainterService from "../../services/painter/Painter";
import { ReducerAction } from "../Types";
import { ActionTypes, State } from "./Types";

const initialState: State = {
  painterService: new PainterService(),
  data: [],
  isParsingData: false,
  isReplayWidgetVisible: false,
  isTradingPanelVisible: false,
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
    case ActionTypes.SET_PAINTER_SERVICE:
      return {
        ...state,
        painterService: action.payload as State["painterService"],
      };

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

    default:
      return state;
  }
};

export const GlobalContextProvider: React.FC = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <GlobalContext.Provider value={{ state, dispatch }}>{children}</GlobalContext.Provider>;
};

export { reducer, initialState };
