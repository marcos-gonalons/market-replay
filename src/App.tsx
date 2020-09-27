import React from "react";

import { ToastContainer } from "react-toastify";

import Canvas from "./components/canvas/Canvas";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App(): JSX.Element {
  return (
    <main>
      <Canvas />
      <ToastContainer />
    </main>
  );
}

export default App;
