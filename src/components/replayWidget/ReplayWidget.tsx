import React, { useContext, useRef } from "react";
import Draggable from "react-draggable";
import DateFnsUtils from "@date-io/date-fns";

import { GlobalContext } from "../../context/globalContext/GlobalContext";

import styles from "./ReplayWidget.module.css";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { setIsReplayWidgetVisible } from "../../context/globalContext/Actions";
import { toast } from "react-toastify";

function ReplayWidget(): JSX.Element {
  const {
    state: { isReplayWidgetVisible, data, painterService },
    dispatch,
  } = useContext(GlobalContext);

  // This weird ref is necessary otherwise the console throws a warning.
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
                painterService.startReplay();
              }}
            >
              Start
            </button>
            <button
              onClick={() => {
                painterService.togglePause();
              }}
            >
              Pause/Resume
            </button>
            <button
              onClick={() => {
                painterService.stopReplay();
                dispatch(setIsReplayWidgetVisible(false));
              }}
            >
              Quit
            </button>
          </div>
        </div>
      </Draggable>
      {renderHiddenDatePicker(data[0].date, data[data.length - 1].date, (d: Date) =>
        painterService.updateOffsetByDate(d)
      )}
    </>
  );
}

function renderHiddenDatePicker(
  smallestPossibleDate: Date,
  biggestPossibleDate: Date,
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
