import React, { useContext } from "react";
import { setIsTradingPanelVisible } from "../../../context/globalContext/Actions";
import { GlobalContext } from "../../../context/globalContext/GlobalContext";

// import styles from "./TradingPanelButton.module.css";

function TradingPanelButton(): JSX.Element {
  const { dispatch } = useContext(GlobalContext);

  return (
    <button
      onClick={() => {
        dispatch(setIsTradingPanelVisible(true));
      }}
    >
      Trading panel
    </button>
  );
}

export default TradingPanelButton;
