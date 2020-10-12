import { ReducerAction } from "../Types";
import { ActionTypes, Script } from "./Types";

export function addScript(payload: Script): ReducerAction {
  return {
    type: ActionTypes.ADD_SCRIPT,
    payload,
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
