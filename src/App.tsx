import React, { useState } from "react";

import { ToastContainer } from "react-toastify";

import Canvas from "./components/canvas/Canvas";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App(): JSX.Element {
  const [isParsingData, setIsParsingData] = useState<boolean>(false);

  // TODO: Use context API, check this https://blog.logrocket.com/use-hooks-and-context-not-react-and-redux/
  console.log(isParsingData);
  return (
    <main>
      <Canvas setIsParsingDataCallback={setIsParsingData} />
      <ToastContainer />
    </main>
  );
}

export default App;
