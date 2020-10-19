import React from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { GlobalContextProvider } from "./context/globalContext/GlobalContext";
import GlobalContextWrap from "./components/globalContextWrap/GlobalContextWrap";

import "./App.css";
import { TradesContextProvider } from "./context/tradesContext/TradesContext";

function App(): JSX.Element {
  return (
    <>
      <GlobalContextProvider>
        <main id="main-container">
          <TradesContextProvider>
            <GlobalContextWrap />
          </TradesContextProvider>
        </main>
      </GlobalContextProvider>
      <ToastContainer />
    </>
  );
}

export default App;
