import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "semantic-ui-css/semantic.min.css";
import "./App.css";
import GlobalContextWrap from "./components/globalContextWrap/GlobalContextWrap";
import { GlobalContextProvider } from "./context/globalContext/GlobalContext";
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
