import React, { useContext, useRef } from "react";
import Draggable from "react-draggable";
import { setIsScriptsPanelVisible } from "../../context/globalContext/Actions";

import { GlobalContext } from "../../context/globalContext/GlobalContext";

import styles from "./ScriptsPanel.module.css";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible },
    dispatch,
  } = useContext(GlobalContext);

  // This weird ref is necessary for the Draggable component otherwise the console throws a warning.
  const ref = useRef(null);

  if (!isScriptsPanelVisible) {
    return <></>;
  }
  return (
    <>
      <Draggable nodeRef={ref} defaultClassName={styles["panel-container"]} axis="both" handle={`.${styles["handle"]}`}>
        <div ref={ref}>
          <div className={styles["handle"]}>+</div>
          <div onClick={() => dispatch(setIsScriptsPanelVisible(false))}>X</div>
          <div>SCRIPTS PANEL</div>
        </div>
      </Draggable>
    </>
  );
}

export default ScriptsPanel;
