import React from "react";
import FileSelector from "./fileSelector/FileSelector";
import ReplayButton from "./replayButton/ReplayButton";

import styles from "./TopBar.module.css";
import TradingPanelButton from "./tradingPanelButton/TradingPanelButton";

function TopBar(): JSX.Element {
  return (
    <header className={styles["top-bar"]}>
      <FileSelector />
      <ReplayButton />
      <TradingPanelButton />
    </header>
  );
}

export default TopBar;
