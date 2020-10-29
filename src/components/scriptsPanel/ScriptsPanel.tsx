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
  setIndexOfTheScriptBeingExecuted,
  setProgress,
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
import { getNSigmaWithWeightedAverage } from "../../utils/Utils";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible, replayerService, scriptsExecutionerService, painterService, worker },
    dispatch: globalContextDispatch,
  } = useContext(GlobalContext);
  const {
    state: { scripts, indexOfTheScriptBeingEdited, indexOfTheScriptBeingExecuted, progress },
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

      scriptsContextDispatch(setProgress(progress));

      if (progress === 100) {
        tradesContext.dispatch(setTrades(trades));
        tradesContext.dispatch(setBalance(balance));
        scriptsContextDispatch(setProgress(0));
        scriptsContextDispatch(setIndexOfTheScriptBeingExecuted(null));

        painterService.draw();

        if (reports) {
          console.log(reports);

          let percentages: number[] = [];
          let totals: number[] = [];
          for (const h in reports[0]) {
            percentages.push(reports[0][h].successPercentage);
            totals.push(reports[0][h].total);
          }

          console.log("hour 3 sigma", getNSigmaWithWeightedAverage(3, totals, percentages));
          console.log("hour 4 sigma", getNSigmaWithWeightedAverage(4, totals, percentages));
          console.log("hour 5 sigma", getNSigmaWithWeightedAverage(5, totals, percentages));
          console.log("hour 6 sigma", getNSigmaWithWeightedAverage(6, totals, percentages));

          percentages = [];
          totals = [];
          for (const d in reports[1]) {
            percentages.push(reports[1][d].successPercentage);
            totals.push(reports[1][d].total);
          }

          console.log("weekday 3 sigma", getNSigmaWithWeightedAverage(3, totals, percentages));
          console.log("weekday 4 sigma", getNSigmaWithWeightedAverage(4, totals, percentages));
          console.log("weekday 5 sigma", getNSigmaWithWeightedAverage(5, totals, percentages));
          console.log("weekday 6 sigma", getNSigmaWithWeightedAverage(6, totals, percentages));

          percentages = [];
          totals = [];
          for (const d in reports[2]) {
            percentages.push(reports[2][d].successPercentage);
            totals.push(reports[2][d].total);
          }

          console.log("month 3 sigma", getNSigmaWithWeightedAverage(3, totals, percentages));
          console.log("month 4 sigma", getNSigmaWithWeightedAverage(4, totals, percentages));
          console.log("month 5 sigma", getNSigmaWithWeightedAverage(5, totals, percentages));
          console.log("month 6 sigma", getNSigmaWithWeightedAverage(6, totals, percentages));
        }
      }
    });
  }, [scriptsExecutionerService, painterService, tradesContext, scriptsContextDispatch, worker, isListenerSetted]);

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
                indexOfTheScriptBeingExecuted,
                progress,
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
  indexOfTheScriptBeingExecuted: number | null,
  progress: number,
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
          dispatch(setIndexOfTheScriptBeingExecuted(index));
          worker.postMessage({
            type: "scripts-executioner",
            payload: { script: s, data, initialBalance: 10000 },
          });
        }}
      >
        Execute
      </button>
      {indexOfTheScriptBeingExecuted === index ? <span>Progress: {progress}</span> : ""}
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
