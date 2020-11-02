import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";
import React, { useContext, useEffect, useState } from "react";
import Editor from "react-simple-code-editor";
import { toast } from "react-toastify";
import { Modal } from "semantic-ui-react";
import { setIsScriptsPanelVisible } from "../../context/globalContext/Actions";
import { GlobalContext } from "../../context/globalContext/GlobalContext";
import {
  addScript,
  modifyScriptContents,
  setIndexOfTheScriptBeingExecuted,
  setProgress,
} from "../../context/scriptsContext/Actions";
import { ScriptsContext } from "../../context/scriptsContext/ScriptsContext";
import { State as ScriptsContextState } from "../../context/scriptsContext/Types";
import { setBalance, setTrades } from "../../context/tradesContext/Actions";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import { State as TradesContextState } from "../../context/tradesContext/Types";
import { ReducerAction } from "../../context/Types";
import PainterService from "../../services/painter/Painter";
import { Report } from "../../services/reporter/Types";
import { getNSigmaWithWeightedAverage } from "../../utils/Utils";
import { MessageOut, ScriptExecutionerWorkerMessageOut } from "../../worker/Types";
import HelpModal from "./helpModal/HelpModal";
import ReportModal from "./reportModal/ReportModal";
import ScriptsList from "./scriptsList/ScriptsList";
import styles from "./ScriptsPanel.module.css";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible, replayerService, scriptsExecutionerService, painterService, worker },
    dispatch: globalContextDispatch,
  } = useContext(GlobalContext);
  const scriptsContext = useContext(ScriptsContext);
  const {
    state: { scripts, indexOfTheScriptBeingEdited },
    dispatch: scriptsContextDispatch,
  } = scriptsContext;
  const tradesContext = useContext(TradesContext);

  const [isHelpModalVisible, setIsHelpModalVisible] = useState<boolean>(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState<boolean>(false);
  const [scriptReports, setScriptReports] = useState<Report[]>([]);
  const [isListenerSetted, setIsListenerSetted] = useState<boolean>(false);

  useEffect(() => {
    if (!scriptsExecutionerService || !painterService || isListenerSetted) return;

    setIsListenerSetted(true);
    worker.addEventListener("message", ({ data }: MessageEvent) => {
      onReceiveMsgFromWorker(
        data,
        scriptsContext,
        tradesContext,
        painterService,
        setScriptReports,
        setIsReportModalVisible
      );
    });
  }, [
    scriptsExecutionerService,
    painterService,
    tradesContext,
    scriptsContext,
    worker,
    isListenerSetted,
    setScriptReports,
    setIsReportModalVisible,
  ]);

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
        size="fullscreen"
        centered={false}
        open={true}
        onClose={() => globalContextDispatch(setIsScriptsPanelVisible(false))}
      >
        <Modal.Content>
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
                <ScriptsList />
                {renderAddScriptButton(scriptsContextDispatch)}
                {renderHelpModalButton(() => setIsHelpModalVisible(true))}
              </aside>
              <section className={styles["script-contents"]}>
                <Editor
                  value={scripts[indexOfTheScriptBeingEdited] ? scripts[indexOfTheScriptBeingEdited].contents : ""}
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
        </Modal.Content>
      </Modal>
      <HelpModal isVisible={isHelpModalVisible} onClose={() => setIsHelpModalVisible(false)} />
      <ReportModal
        reports={scriptReports}
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
      />
    </>
  );
}

function renderAddScriptButton(dispatch: React.Dispatch<ReducerAction>): JSX.Element {
  return <button onClick={() => dispatch(addScript())}>Add new script</button>;
}

function renderHelpModalButton(onClick: () => void): JSX.Element {
  return <button onClick={onClick}>Help</button>;
}

function onReceiveMsgFromWorker(
  msg: MessageOut & { error: Error },
  scriptsContext: { state: ScriptsContextState; dispatch: React.Dispatch<ReducerAction> },
  tradesContext: { state: TradesContextState; dispatch: React.Dispatch<ReducerAction> },
  painterService: PainterService,
  setScriptReports: (reports: Report[]) => void,
  setIsReportModalVisible: (value: boolean) => void
): void {
  const { error, type, payload } = msg;

  if (error) {
    toast.error(`An error occurred: ${error.message}`);
    return;
  }

  if (type !== "scripts-executioner") return;

  const { balance, progress, trades, reports } = payload as ScriptExecutionerWorkerMessageOut;

  scriptsContext.dispatch(setProgress(progress));

  if (progress === 100) {
    tradesContext.dispatch(setTrades(trades));
    tradesContext.dispatch(setBalance(balance));
    scriptsContext.dispatch(setProgress(0));
    scriptsContext.dispatch(setIndexOfTheScriptBeingExecuted(null));

    painterService.draw();

    if (reports) {
      setIsReportModalVisible(true);
      setScriptReports(reports);

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
}

export default ScriptsPanel;
