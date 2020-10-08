import React from "react";

import { ToastContainer } from "react-toastify";

import Canvas from "./components/canvas/Canvas";
import { GlobalContextProvider } from "./context/globalContext/GlobalContext";

import ReplayWidget from "./components/replayWidget/ReplayWidget";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import TradingPanel from "./components/tradingPanel/TradingPanel";
import TopBar from "./components/topBar/TopBar";
import { TradesContextProvider } from "./context/tradesContext/TradesContext";

function App(): JSX.Element {
  return (
    <>
      <GlobalContextProvider>
        <main id="main-container">
          <TopBar />
          <TradesContextProvider>
            <Canvas />
            <TradingPanel />
          </TradesContextProvider>
          <ReplayWidget />
        </main>
      </GlobalContextProvider>
      <ToastContainer />
    </>
  );
}

export default App;
