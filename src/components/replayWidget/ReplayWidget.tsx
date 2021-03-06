import React, { useContext, useRef } from "react";
import Draggable from "react-draggable";
import DateFnsUtils from "@date-io/date-fns";

import { GlobalContext } from "../../context/globalContext/GlobalContext";

import styles from "./ReplayWidget.module.css";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import {
  setIsReplayActive,
  setIsReplayWidgetVisible,
  setIsTradingPanelVisible,
} from "../../context/globalContext/Actions";
import { toast } from "react-toastify";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import { removeAllOrders } from "../../context/tradesContext/Actions";

function ReplayWidget(): JSX.Element {
  const {
    state: { isReplayWidgetVisible, data, painterService, replayerService },
    dispatch: globalContextDispatch,
  } = useContext(GlobalContext);
  const { dispatch: tradesContextDispatch } = useContext(TradesContext);

  // This weird ref is necessary for the Draggable component otherwise the console throws a warning.
  const ref = useRef(null);

  if (!isReplayWidgetVisible) {
    return <></>;
  }
  return (
    <>
      <Draggable
        nodeRef={ref}
        defaultClassName={styles["widget-container"]}
        axis="both"
        handle={`.${styles["handle"]}`}
      >
        <div ref={ref}>
          <div className={styles["handle"]}>+</div>
          <div>
            <span onClick={() => getDatepickerButton(styles["hidden-datepicker"]).click()}>Move to</span>
            <button
              onClick={() => {
                replayerService!.startReplay();
                globalContextDispatch(setIsReplayActive(true));
              }}
            >
              Start
            </button>
            <button
              onClick={() => {
                replayerService!.togglePause();
              }}
            >
              Pause/Resume
            </button>
            <button
              onClick={() => {
                tradesContextDispatch(removeAllOrders());
                globalContextDispatch(setIsReplayActive(false));
                replayerService!.stopReplay();
              }}
            >
              Stop
            </button>
            <button
              onClick={() => {
                replayerService!.stopReplay();
                tradesContextDispatch(removeAllOrders());
                globalContextDispatch(setIsTradingPanelVisible(false));
                globalContextDispatch(setIsReplayActive(false));
                globalContextDispatch(setIsReplayWidgetVisible(false));
              }}
            >
              Quit
            </button>
          </div>
          <div>
            You can use the space bar to pause and left/right arrows while in pause to move the candles back and forth
          </div>
        </div>
      </Draggable>
      {renderHiddenDatePicker(data[0].timestamp, data[data.length - 1].timestamp, (d: Date) =>
        painterService!.setOffsetByDate(d)
      )}
    </>
  );
}

function renderHiddenDatePicker(
  smallestPossibleTimestamp: number,
  biggestPossibleTimestamp: number,
  onChange: (d: Date) => void
): JSX.Element {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        className={styles["hidden-datepicker"]}
        value={null}
        DialogProps={{ className: styles["hidden-datepicker-dialog"] }}
        views={["year", "month"]}
        onChange={(d) => {
          let date = new Date(d!.valueOf());
          date.setDate(1);
          date.setSeconds(0);
          date.setMinutes(0);
          date.setHours(0);

          const smallestPossibleDate = new Date(smallestPossibleTimestamp);
          const biggestPossibleDate = new Date(biggestPossibleTimestamp);

          if (date.valueOf() < smallestPossibleDate.valueOf()) {
            date = smallestPossibleDate;
            toast.warn(`Starting from ${date.toLocaleString()} since the data doesn't contain older dates`);
          }
          if (date.valueOf() > biggestPossibleDate.valueOf()) {
            toast.error("Please select a smaller date");
            return;
          }

          onChange(date);
        }}
      />
    </MuiPickersUtilsProvider>
  );
}

function getDatepickerButton(className: string): HTMLElement {
  return (document
    .getElementsByClassName(className)[0]
    .getElementsByClassName("MuiIconButton-root")[0] as unknown) as HTMLElement;
}

export default ReplayWidget;
