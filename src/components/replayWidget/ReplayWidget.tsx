import React, { useContext, useRef, useState, useEffect } from "react";
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

  const [startDate, setStartDate] = useState<Date>(new Date());

  // This weird ref is necessary otherwise the console throws a warning.
  const ref = useRef(null);

  useEffect(() => {
    painterService.updateOffsetByDate(startDate);
  }, [painterService, startDate]);

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
            <span onClick={() => getDatepickerButton(styles["hidden-datepicker"]).click()}>
              From: {startDate.toDateString()}
            </span>
            <button>Start</button>
            <button>Pause</button>
            <button
              onClick={() => {
                dispatch(setIsReplayWidgetVisible(false));
              }}
            >
              Quit
            </button>
          </div>
        </div>
      </Draggable>
      {renderHiddenDatePicker(startDate, setStartDate, data[0].date, data[data.length - 1].date)}
    </>
  );
}

function renderHiddenDatePicker(
  startDate: Date,
  onChange: (d: Date) => void,
  smallestPossibleDate: Date,
  biggestPossibleDate: Date
): JSX.Element {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        className={styles["hidden-datepicker"]}
        value={startDate}
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
    .getElementsByClassName("MuiIconButton-root")[0] as any) as HTMLElement;
}

export default ReplayWidget;
