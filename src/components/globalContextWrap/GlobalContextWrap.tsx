import React, { useContext, useEffect } from "react";
import { setServices } from "../../context/globalContext/Actions";
import { GlobalContext } from "../../context/globalContext/GlobalContext";
import { ScriptsContextProvider } from "../../context/scriptsContext/ScriptsContext";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import PainterService from "../../services/painter/Painter";
import ReplayerService from "../../services/replayer/Replayer";
import ScriptsExecutionerService from "../../services/scriptsExecutioner/ScriptsExecutioner";
import Canvas from "../canvas/Canvas";
import ReplayWidget from "../replayWidget/ReplayWidget";
import ScriptsPanel from "../scriptsPanel/ScriptsPanel";
import TopBar from "../topBar/TopBar";
import TradingPanel from "../tradingPanel/TradingPanel";

function GlobalContextWrap(): JSX.Element {
  const {
    dispatch,
    state: { painterService, replayerService, scriptsExecutionerService },
  } = useContext(GlobalContext);
  const tradesContext = useContext(TradesContext);

  useEffect(() => {
    const painterService = new PainterService(tradesContext);
    const scriptsExecutionerService = new ScriptsExecutionerService();
    scriptsExecutionerService.setPainterService(painterService);
    scriptsExecutionerService.setTradesContext(tradesContext);
    const replayerService = new ReplayerService(painterService, scriptsExecutionerService, tradesContext);

    dispatch(setServices({ painterService, replayerService, scriptsExecutionerService }));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // TODO: Maybe another service, static one, to save the state there
    // and the services read it from there
    painterService?.updateTradesContextState(tradesContext.state);
    replayerService?.updateTradesContextState(tradesContext.state);
    scriptsExecutionerService?.updateTradesContextState(tradesContext.state);
  }, [tradesContext.state, painterService, replayerService, scriptsExecutionerService]);

  return (
    <>
      <TopBar />
      <Canvas />
      <TradingPanel />
      <ReplayWidget />
      <ScriptsContextProvider>
        <ScriptsPanel />
      </ScriptsContextProvider>
    </>
  );
}

export default GlobalContextWrap;
