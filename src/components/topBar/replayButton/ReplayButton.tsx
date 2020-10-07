import React, { useContext } from "react";
import { toast } from "react-toastify";
import { setIsReplayWidgetVisible } from "../../../context/globalContext/Actions";
import { GlobalContext } from "../../../context/globalContext/GlobalContext";

// import styles from "./ReplayButton.module.css";

function ReplayButton(): JSX.Element {
  const {
    dispatch,
    state: { data },
  } = useContext(GlobalContext);

  return (
    <button
      onClick={() => {
        if (!data || !data.length) {
          toast.error("First you must select a CSV file with the data");
        } else {
          dispatch(setIsReplayWidgetVisible(true));
        }
      }}
    >
      Replay mode
    </button>
  );
}

export default ReplayButton;
