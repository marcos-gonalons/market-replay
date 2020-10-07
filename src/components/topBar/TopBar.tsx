import React from "react";
import ReplayButton from "./replayButton/ReplayButton";

import styles from "./TopBar.module.css";
import TradingPanelButton from "./tradingPanelButton/TradingPanelButton";

function TopBar(): JSX.Element {
  return (
    <header className={styles["top-bar"]}>
      <div>
        <ReplayButton />
        <TradingPanelButton />
      </div>
    </header>
  );
}

export default TopBar;
