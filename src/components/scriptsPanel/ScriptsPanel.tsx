import React, { useContext, useEffect, useState } from "react";
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
import ScriptsExecutionerService from "../../services/scriptsExecutioner/ScriptsExecutioner";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible, replayerService, scriptsExecutionerService },
    dispatch: globalContextDispatch,
  } = useContext(GlobalContext);
  const {
    state: { scripts, indexOfTheScriptBeingEdited },
    dispatch: scriptsContextDispatch,
  } = useContext(ScriptsContext);

  const [isHelpModalVisible, setIsHelpModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!scriptsExecutionerService) return;
    scriptsExecutionerService.setScripts(scripts);

    if (replayerService!.isReplayActive() && !replayerService!.isReplayPaused()) {
      replayerService!.togglePause();
    }
  }, [scripts, replayerService, scriptsExecutionerService]);

  if (!isScriptsPanelVisible) {
    return <></>;
  }
  return (
    <>
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
              {renderScriptNames(
                scripts,
                indexOfTheScriptBeingEdited,
                scriptsContextDispatch,
                scriptsExecutionerService!
              )}
              {renderAddScriptButton(scriptsContextDispatch)}
              {renderHelpModalButton(() => setIsHelpModalVisible(true))}
            </aside>
            <section className={styles["script-contents"]}>
              <Editor
                value={scripts[indexOfTheScriptBeingEdited].contents}
                onValueChange={(c) => {
                  scriptsContextDispatch(
                    modifyScriptContents({ scriptIndex: indexOfTheScriptBeingEdited, contents: c })
                  );
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
      {renderHelpModal(isHelpModalVisible, () => setIsHelpModalVisible(false))}
    </>
  );
}

function renderScriptNames(
  scripts: Script[],
  indexOfTheScriptBeingEdited: number,
  dispatch: React.Dispatch<ReducerAction>,
  scriptsExecutionerService: ScriptsExecutionerService
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
      <button onClick={() => scriptsExecutionerService.executeWithFullData(s)}>Execute</button>
    </div>
  ));
}

function renderAddScriptButton(dispatch: React.Dispatch<ReducerAction>): JSX.Element {
  return <button onClick={() => dispatch(addScript())}>Add new script</button>;
}

function renderHelpModalButton(onClick: () => void): JSX.Element {
  return <button onClick={onClick}>Help</button>;
}

function renderHelpModal(isVisible: boolean, onClose: () => void): JSX.Element {
  return (
    <Modal
      ariaHideApp={false}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      isOpen={isVisible}
      onRequestClose={onClose}
      style={{
        content: {},
      }}
    >
      /** * Variables that are accessible * ----------------------------- * - candles * Array containing all the candles
      * Every item of the array is an object with this properties: * timestamp, open, high, low, close, volume * * -
      currentCandle * The candle where the replay is at * * * Functions that can be called *
      ---------------------------- * - createOrder * Allows to create market/limit orders. Returns the index of the
      order created. * * Example for a market order
      {`createOrder({
 *     type: "market",
 *     position: "long",
 *     size: 50,
 *     stopLoss: 12345
 *   })'`}
      * * * Example for a limit order *{" "}
      {`createOrder({
 *     type: "limit",
 *     position: "short",
 *     size: 100,
 *     price: 1234.56,
 *     stopLoss: 1244.77,
 *     takeProfit: 1200.02
 *   })`}
      * * */
    </Modal>
  );
}

export default ScriptsPanel;
