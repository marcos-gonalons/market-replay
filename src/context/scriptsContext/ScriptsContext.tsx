import React, { useReducer, createContext, Dispatch } from "react";
import { ReducerAction } from "../Types";
import { ActionTypes, Script, State } from "./Types";

const initialState: State = {
  scripts: [],
};

export const ScriptsContext = createContext<{
  state: State;
  dispatch: Dispatch<ReducerAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const reducer = (state: State, action: ReducerAction): State => {
  let scriptsCopy: State["scripts"];
  switch (action.type) {
    case ActionTypes.ADD_SCRIPT:
      scriptsCopy = JSON.parse(JSON.stringify(state.scripts));
      scriptsCopy.push(action.payload as Script);
      return {
        ...state,
        scripts: scriptsCopy,
      };

    case ActionTypes.MODIFY_SCRIPT_NAME:
      const modifyScriptNamePayload = action.payload as { scriptIndex: number; name: string };
      scriptsCopy = JSON.parse(JSON.stringify(state.scripts));
      scriptsCopy[modifyScriptNamePayload.scriptIndex].name = modifyScriptNamePayload.name;
      return {
        ...state,
        scripts: scriptsCopy,
      };

    case ActionTypes.MODIFY_SCRIPT_CONTENTS:
      const modifyScriptContentsPayload = action.payload as { scriptIndex: number; contents: string };
      scriptsCopy = JSON.parse(JSON.stringify(state.scripts));
      scriptsCopy[modifyScriptContentsPayload.scriptIndex].contents = modifyScriptContentsPayload.contents;
      return {
        ...state,
        scripts: scriptsCopy,
      };

    case ActionTypes.SET_SCRIPT_IS_ACTIVE:
      const setScriptIsActivePayload = action.payload as { scriptIndex: number; isActive: boolean };
      scriptsCopy = JSON.parse(JSON.stringify(state.scripts));
      scriptsCopy[setScriptIsActivePayload.scriptIndex].isActive = setScriptIsActivePayload.isActive;
      return {
        ...state,
        scripts: scriptsCopy,
      };

    case ActionTypes.REMOVE_SCRIPT:
      const index = action.payload as number;
      scriptsCopy = JSON.parse(JSON.stringify(state.scripts));
      scriptsCopy.splice(index, 1);
      return {
        ...state,
        scripts: scriptsCopy,
      };

    default:
      return state;
  }
};

export const ScriptsContextProvider: React.FC = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <ScriptsContext.Provider value={{ state, dispatch }}>{children}</ScriptsContext.Provider>;
};

export { reducer, initialState };
