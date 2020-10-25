import { ReducerAction } from "../Types";
import { ActionTypes } from "./Types";

export function addScript(): ReducerAction {
  return {
    type: ActionTypes.ADD_SCRIPT,
  };
}

export function modifyScriptName(payload: { scriptIndex: number; name: string }): ReducerAction {
  return {
    type: ActionTypes.MODIFY_SCRIPT_NAME,
    payload,
  };
}

export function modifyScriptContents(payload: { scriptIndex: number; contents: string }): ReducerAction {
  return {
    type: ActionTypes.MODIFY_SCRIPT_CONTENTS,
    payload,
  };
}

export function setScriptIsActive(payload: { scriptIndex: number; isActive: boolean }): ReducerAction {
  return {
    type: ActionTypes.SET_SCRIPT_IS_ACTIVE,
    payload,
  };
}

export function removeScript(scriptIndex: number): ReducerAction {
  return {
    type: ActionTypes.REMOVE_SCRIPT,
    payload: scriptIndex,
  };
}

export function setIndexOfTheScriptBeingEdited(scriptIndex: number): ReducerAction {
  return {
    type: ActionTypes.SET_INDEX_OF_THE_SCRIPT_BEING_EDITED,
    payload: scriptIndex,
  };
}

export function setProgress(progress: number): ReducerAction {
  return {
    type: ActionTypes.SET_PROGRESS,
    payload: progress,
  };
}

export function setIndexOfTheScriptBeingExecuted(index: number | null): ReducerAction {
  return {
    type: ActionTypes.SET_INDEX_OF_THE_SCRIPT_BEING_EXECUTED,
    payload: index,
  };
}
