import React, { useContext } from "react";
import Modal from "react-modal";
import { setIsScriptsPanelVisible } from "../../context/globalContext/Actions";
import { GlobalContext } from "../../context/globalContext/GlobalContext";

import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";

import styles from "./ScriptsPanel.module.css";
import { ScriptsContext } from "../../context/scriptsContext/ScriptsContext";
import {
  addScript,
  modifyScriptContents,
  modifyScriptName,
  removeScript,
  setIndexOfTheScriptBeingEdited,
  setScriptIsActive,
} from "../../context/scriptsContext/Actions";
import { Script } from "../../context/scriptsContext/Types";
import { ReducerAction } from "../../context/Types";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible },
    dispatch: globalContextDispatch,
  } = useContext(GlobalContext);
  const {
    state: { scripts, indexOfTheScriptBeingEdited },
    dispatch: scriptsContextDispatch,
  } = useContext(ScriptsContext);

  if (!isScriptsPanelVisible) {
    return <></>;
  }
  return (
    <Modal
      ariaHideApp={false}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      isOpen={true}
      onRequestClose={() => globalContextDispatch(setIsScriptsPanelVisible(false))}
    >
      <article className={styles["modal-container"]}>
        <button
          tabIndex={-1}
          className={styles["x"]}
          onClick={() => globalContextDispatch(setIsScriptsPanelVisible(false))}
        >
          X
        </button>
        <section className={styles["contents"]}>
          <aside className={styles["script-names"]}>
            {renderScriptNames(scripts, indexOfTheScriptBeingEdited, scriptsContextDispatch)}
            {renderAddScriptButton(scriptsContextDispatch)}
          </aside>
          <section className={styles["script-contents"]}>
            <Editor
              value={scripts[indexOfTheScriptBeingEdited].contents}
              onValueChange={(c) => {
                scriptsContextDispatch(modifyScriptContents({ scriptIndex: indexOfTheScriptBeingEdited, contents: c }));
              }}
              highlight={(code) => highlight(code, languages.js, "js")}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
              }}
              preClassName={"language-markup line-numbers"}
            />
          </section>
        </section>
      </article>
    </Modal>
  );
}

function renderScriptNames(
  scripts: Script[],
  indexOfTheScriptBeingEdited: number,
  dispatch: React.Dispatch<ReducerAction>
): JSX.Element[] {
  return scripts.map((s, index) => (
    <div key={index}>
      <input
        type="text"
        value={s.name}
        onChange={({ target: { value } }) => {
          dispatch(modifyScriptName({ scriptIndex: index, name: value }));
        }}
      />
      <button onClick={() => dispatch(setScriptIsActive({ scriptIndex: index, isActive: !s.isActive }))}>
        {s.isActive ? "Deactivate" : "Activate"}
      </button>
      <button onClick={() => dispatch(setIndexOfTheScriptBeingEdited(index))}>Edit script</button>
      {index > 0 ? (
        <button
          onClick={() => {
            if (index === indexOfTheScriptBeingEdited) {
              dispatch(setIndexOfTheScriptBeingEdited(0));
            }
            dispatch(removeScript(index));
          }}
        >
          X
        </button>
      ) : (
        ""
      )}
    </div>
  ));
}

function renderAddScriptButton(dispatch: React.Dispatch<ReducerAction>): JSX.Element {
  return <button onClick={() => dispatch(addScript())}>Add new script</button>;
}

export default ScriptsPanel;
