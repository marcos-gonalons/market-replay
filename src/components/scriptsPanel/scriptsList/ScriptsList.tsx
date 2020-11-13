import React, { useContext } from "react";
import { GlobalContext } from "../../../context/globalContext/GlobalContext";
import { Candle } from "../../../context/globalContext/Types";
import {
  modifyScriptName,
  removeScript,
  setIndexOfTheScriptBeingEdited,
  setIndexOfTheScriptBeingExecuted,
  setScriptIsActive,
} from "../../../context/scriptsContext/Actions";
import { ScriptsContext } from "../../../context/scriptsContext/ScriptsContext";
import { Script } from "../../../context/scriptsContext/Types";
import { ReducerAction } from "../../../context/Types";
import { AppWorker } from "../../../worker/Types";

export default function ScriptsList(): JSX.Element {
  const {
    state: { scripts, indexOfTheScriptBeingEdited, indexOfTheScriptBeingExecuted, progress },
    dispatch,
  } = useContext(ScriptsContext);
  const {
    state: { worker, painterService },
  } = useContext(GlobalContext);

  const list = scripts.map((s, index) => (
    <div key={index}>
      {renderScriptNameInput(s.name, index, dispatch)}
      {renderActivateScriptButton(index, s.isActive, dispatch)}
      {renderEditScriptButton(index, dispatch)}
      {index > 0 ? renderRemoveScriptButton(index, indexOfTheScriptBeingEdited, dispatch) : ""}
      {renderExecuteScriptButton(index, s, painterService!.getData(), dispatch, worker)}
      {indexOfTheScriptBeingExecuted === index ? <span>Progress: {progress}</span> : ""}
    </div>
  ));

  return <>{list}</>;
}

function renderScriptNameInput(
  name: string,
  scriptIndex: number,
  dispatch: React.Dispatch<ReducerAction>
): JSX.Element {
  return (
    <input
      type="text"
      value={name}
      onChange={({ target: { value } }) => dispatch(modifyScriptName({ scriptIndex, name: value }))}
    />
  );
}

function renderActivateScriptButton(
  scriptIndex: number,
  isActive: boolean,
  dispatch: React.Dispatch<ReducerAction>
): JSX.Element {
  return (
    <button onClick={() => dispatch(setScriptIsActive({ scriptIndex, isActive: !isActive }))}>
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

function renderEditScriptButton(scriptIndex: number, dispatch: React.Dispatch<ReducerAction>): JSX.Element {
  return <button onClick={() => dispatch(setIndexOfTheScriptBeingEdited(scriptIndex))}>Edit script</button>;
}

function renderRemoveScriptButton(
  scriptIndex: number,
  indexOfTheScriptBeingEdited: number,
  dispatch: React.Dispatch<ReducerAction>
): JSX.Element {
  return (
    <button
      onClick={() => {
        if (scriptIndex < indexOfTheScriptBeingEdited) {
          dispatch(setIndexOfTheScriptBeingEdited(indexOfTheScriptBeingEdited - 1));
        }
        dispatch(removeScript(scriptIndex));
      }}
    >
      X
    </button>
  );
}

function renderExecuteScriptButton(
  scriptIndex: number,
  script: Script,
  data: Candle[],
  dispatch: React.Dispatch<ReducerAction>,
  worker: AppWorker
): JSX.Element {
  return (
    <button
      onClick={() => {
        dispatch(setIndexOfTheScriptBeingExecuted(scriptIndex));
        worker.postMessage({
          type: "scripts-executioner",
          payload: { script, data, initialBalance: 10000 },
        });
      }}
    >
      Execute
    </button>
  );
}
