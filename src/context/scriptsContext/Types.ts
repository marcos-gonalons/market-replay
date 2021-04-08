import { ScriptParams } from "../../services/scriptsExecutioner/Types";

interface Script {
  name: string;
  contents: string;
  isActive: boolean;
}

interface State {
  readonly scripts: Script[];
  readonly indexOfTheScriptBeingEdited: number;
  readonly progress: number;
  readonly indexOfTheScriptBeingExecuted: number | null;
  readonly best: ScriptParams | null;
}

const ActionTypes = {
  ADD_SCRIPT: "SCRIPTS_CONTEXT_ADD_SCRIPT",
  MODIFY_SCRIPT_NAME: "SCRIPTS_CONTEXT_MODIFY_SCRIPT_NAME",
  MODIFY_SCRIPT_CONTENTS: "SCRIPTS_CONTEXT_MODIFY_SCRIPT_CONTENTS",
  SET_SCRIPT_IS_ACTIVE: "SCRIPTS_CONTEXT_SET_SCRIPT_IS_ACTIVE",
  REMOVE_SCRIPT: "SCRIPTS_CONTEXT_REMOVE_SCRIPT",
  SET_INDEX_OF_THE_SCRIPT_BEING_EDITED: "SCRIPTS_CONTEXT_SET_INDEX_OF_THE_SCRIPT_BEING_EDITED",
  SET_PROGRESS: "SCRIPTS_CONTEXT_SET_PROGRESS",
  SET_BEST: "SCRIPTS_CONTEXT_SET_BEST",
  SET_INDEX_OF_THE_SCRIPT_BEING_EXECUTED: "SCRIPTS_CONTEXT_SET_INDEX_OF_THE_SCRIPT_BEING_EXECUTED",
};

export { ActionTypes };
export type { State, Script };
