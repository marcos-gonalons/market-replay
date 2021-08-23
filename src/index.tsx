import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "";
});


alert(`
  In the bot: spread 3 is actually fine for resistance now :)
  So maybe allow spread 3 in the bot


  Add dynamic trailing stop
  The closer to tp, the closer the SL to break even
  Play with different parameters. Use the params array to test different combinations.

  Try this: max 1 long trade/1 short trade per day
  Let's see if improves the results
  My logic is: 34 is already lots of points, so
  probably it will not continue going up/down for another 34
  points the same day.
  So let's check if this improves the results.

  Also check this: instead of not doing the trade,
  do the trade but with a limit order in the opposite direction
  And check that
  But I should check different combinatinos of tp/sl for this 'extraTrade' ;)
  To see if its feasible.
  Let's do it
`);

alert(`fix volume, the eurusd-1h volume is wrong`);

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
