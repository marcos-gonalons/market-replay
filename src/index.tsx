import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

/*
alert(`
  In the bot: spread 3 is actually fine for resistance now :)
  So maybe allow spread 3 in the bot


  Add dynamic trailing stop
  The closer to tp, the closer the SL to break even
  Play with different parameters. Use the params array to test different combinations.
`);
*/
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
