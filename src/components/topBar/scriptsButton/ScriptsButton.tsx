import React, { useContext } from "react";
import { setIsScriptsPanelVisible } from "../../../context/globalContext/Actions";
import { GlobalContext } from "../../../context/globalContext/GlobalContext";

// import styles from "./ScriptsButton.module.css";

function ScriptsButton(): JSX.Element {
  const { dispatch } = useContext(GlobalContext);
  return <button onClick={() => dispatch(setIsScriptsPanelVisible(true))}>Scripts</button>;
}

export default ScriptsButton;
