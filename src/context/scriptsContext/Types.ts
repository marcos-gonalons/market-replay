interface Script {
  name: string;
  contents: string;
  isActive: boolean;
}

interface State {
  readonly scripts: Script[];
}

const ActionTypes = {
  ADD_SCRIPT: "SCRIPTS_CONTEXT_ADD_SCRIPT",
  MODIFY_SCRIPT_NAME: "SCRIPTS_CONTEXT_MODIFY_SCRIPT_NAME",
  MODIFY_SCRIPT_CONTENTS: "SCRIPTS_CONTEXT_MODIFY_SCRIPT_CONTENTS",
  SET_SCRIPT_IS_ACTIVE: "SCRIPTS_CONTEXT_SET_SCRIPT_IS_ACTIVE",
  REMOVE_SCRIPT: "SCRIPTS_CONTEXT_REMOVE_SCRIPT",
};

export { ActionTypes };
export type { State, Script };
