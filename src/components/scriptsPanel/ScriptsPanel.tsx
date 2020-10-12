import React, { useContext } from "react";
import Modal from "react-modal";
import { setIsScriptsPanelVisible } from "../../context/globalContext/Actions";

import { GlobalContext } from "../../context/globalContext/GlobalContext";

import styles from "./ScriptsPanel.module.css";

function ScriptsPanel(): JSX.Element {
  const {
    state: { isScriptsPanelVisible },
    dispatch,
  } = useContext(GlobalContext);

  if (!isScriptsPanelVisible) {
    return <></>;
  }
  return (
    <Modal
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      isOpen={true}
      onRequestClose={() => dispatch(setIsScriptsPanelVisible(false))}
    >
      <div className={styles["modal-container"]}>
        <div onClick={() => dispatch(setIsScriptsPanelVisible(false))}>X</div>
        <div>SCRIPTS PANEL</div>
      </div>
    </Modal>
  );
}

export default ScriptsPanel;
