import React, { useContext } from "react";
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
      disabled={!data || !data.length}
      onClick={() => {
        dispatch(setIsReplayWidgetVisible(true));
      }}
    >
      Replay mode
    </button>
  );
}

export default ReplayButton;
