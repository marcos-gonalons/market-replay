import React from "react";

import { ToastContainer } from "react-toastify";

import Canvas from "./components/canvas/Canvas";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { DataContextProvider } from "./context/dataContext/DataContext";

function App(): JSX.Element {
  return (
    <main>
      <DataContextProvider>
        <Canvas />
      </DataContextProvider>
      <ToastContainer />
    </main>
  );
}

export default App;
