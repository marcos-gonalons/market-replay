import React, { useContext, useRef } from "react";
import Draggable from "react-draggable";

import { GlobalContext } from "../../context/globalContext/GlobalContext";

import styles from "./TradingPanel.module.css";

function TradingPanel(): JSX.Element {
  const {
    state: { isTradingPanelVisible },
  } = useContext(GlobalContext);

  // This weird ref is necessary for the Draggable component otherwise the console throws a warning.
  const ref = useRef(null);

  if (!isTradingPanelVisible) {
    return <></>;
  }
  return (
    <>
      <Draggable nodeRef={ref} defaultClassName={styles["panel-container"]} axis="both" handle={`.${styles["handle"]}`}>
        <div ref={ref}>
          <div className={styles["handle"]}>+</div>
          <div>Le panel ffs</div>
        </div>
      </Draggable>
    </>
  );
}

export default TradingPanel;
