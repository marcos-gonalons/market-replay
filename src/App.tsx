import React from "react";

import { ToastContainer } from "react-toastify";

import Canvas from "./components/canvas/Canvas";
import { GlobalContextProvider } from "./context/globalContext/GlobalContext";

import ReplayWidget from "./components/replayWidget/ReplayWidget";
import ReplayButton from "./components/replayButton/ReplayButton";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import TradingPanel from "./components/tradingPanel/TradingPanel";

function App(): JSX.Element {
  return (
    <main>
      <GlobalContextProvider>
        <Canvas />
        <ReplayButton />
        <ReplayWidget />
        <TradingPanel />
      </GlobalContextProvider>
      <ToastContainer />
    </main>
  );
}

export default App;
