import React, { useReducer, createContext, Dispatch } from "react";
import { ReducerAction } from "../Types";
import { ActionTypes, State } from "./Types";

const initialState: State = {
  data: [],
  isParsingData: false,
};

export const DataContext = createContext<{
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

    default:
      return state;
  }
};

export const DataContextProvider: React.FC = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <DataContext.Provider value={{ state, dispatch }}>{children}</DataContext.Provider>;
};

export { reducer, initialState };
