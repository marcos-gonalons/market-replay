import React from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Canvas from "./components/canvas/Canvas";
import { GlobalContextProvider } from "./context/globalContext/GlobalContext";
import ReplayWidget from "./components/replayWidget/ReplayWidget";

import TradingPanel from "./components/tradingPanel/TradingPanel";
import TopBar from "./components/topBar/TopBar";
import { TradesContextProvider } from "./context/tradesContext/TradesContext";
import ScriptsPanel from "./components/scriptsPanel/ScriptsPanel";

import "./App.css";
import { ScriptsContextProvider } from "./context/scriptsContext/ScriptsContext";

function App(): JSX.Element {
  return (
    <>
      <GlobalContextProvider>
        <main id="main-container">
          <TopBar />
          <TradesContextProvider>
            <Canvas />
            <TradingPanel />
            <ReplayWidget />
          </TradesContextProvider>
          <ScriptsContextProvider>
            <ScriptsPanel />
          </ScriptsContextProvider>
        </main>
      </GlobalContextProvider>
      <ToastContainer />
    </>
  );
}

export default App;
