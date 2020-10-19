interface Script {
  name: string;
  contents: string;
  isActive: boolean;
}

interface State {
  readonly scripts: Script[];
  readonly indexOfTheScriptBeingEdited: number;
}

const ActionTypes = {
  ADD_SCRIPT: "SCRIPTS_CONTEXT_ADD_SCRIPT",
  MODIFY_SCRIPT_NAME: "SCRIPTS_CONTEXT_MODIFY_SCRIPT_NAME",
  MODIFY_SCRIPT_CONTENTS: "SCRIPTS_CONTEXT_MODIFY_SCRIPT_CONTENTS",
  SET_SCRIPT_IS_ACTIVE: "SCRIPTS_CONTEXT_SET_SCRIPT_IS_ACTIVE",
  REMOVE_SCRIPT: "SCRIPTS_CONTEXT_REMOVE_SCRIPT",
  SET_INDEX_OF_THE_SCRIPT_BEING_EDITED: "SCRIPTS_CONTEXT_SET_INDEX_OF_THE_SCRIPT_BEING_EDITED",
};

export { ActionTypes };
export type { State, Script };
