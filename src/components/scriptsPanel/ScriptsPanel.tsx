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
import { toast } from "react-toastify";
import HelpModal from "./helpModal/HelpModal";
import { Candle } from "../../context/globalContext/Types";
import { AppWorker, MessageOut, ScriptExecutionerWorkerMessageOut } from "../../worker/Types";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import { setBalance, setTrades } from "../../context/tradesContext/Actions";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible, replayerService, scriptsExecutionerService, painterService, worker },
    dispatch: globalContextDispatch,
  } = useContext(GlobalContext);
  const {
    state: { scripts, indexOfTheScriptBeingEdited },
    dispatch: scriptsContextDispatch,
  } = useContext(ScriptsContext);
  const tradesContext = useContext(TradesContext);

  const [isHelpModalVisible, setIsHelpModalVisible] = useState<boolean>(false);
  const [isListenerSetted, setIsListenerSetted] = useState<boolean>(false);

  useEffect(() => {
    if (!scriptsExecutionerService || !painterService || isListenerSetted) return;

    setIsListenerSetted(true);
    worker.addEventListener("message", ({ data }: MessageEvent) => {
      const { error, type, payload } = data as MessageOut & { error: Error };

      if (error) {
        toast.error(`An error occurred: ${error.message}`);
        return;
      }

      if (type !== "scripts-executioner") return;

      const { balance, progress, trades, reports } = payload as ScriptExecutionerWorkerMessageOut;

      if (progress === 100) {
        tradesContext.dispatch(setTrades(trades));
        tradesContext.dispatch(setBalance(balance));
        painterService.draw();

        if (reports) {
          console.log(reports);
        }
      }
    });
  }, [scriptsExecutionerService, painterService, tradesContext, worker, isListenerSetted]);

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
                worker,
                painterService!.getData()
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
      <HelpModal isVisible={isHelpModalVisible} onClose={() => setIsHelpModalVisible(false)} />
    </>
  );
}

function renderScriptNames(
  scripts: Script[],
  indexOfTheScriptBeingEdited: number,
  dispatch: React.Dispatch<ReducerAction>,
  worker: AppWorker,
  data: Candle[]
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
      <button
        onClick={() => {
          worker.postMessage({
            type: "scripts-executioner",
            payload: { script: s, data, initialBalance: 10000 },
          });
        }}
      >
        Execute
      </button>
    </div>
  ));
}

function renderAddScriptButton(dispatch: React.Dispatch<ReducerAction>): JSX.Element {
  return <button onClick={() => dispatch(addScript())}>Add new script</button>;
}

function renderHelpModalButton(onClick: () => void): JSX.Element {
  return <button onClick={onClick}>Help</button>;
}

export default ScriptsPanel;
