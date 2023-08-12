import PainterService from "../../services/painter/Painter";
import ReplayerService from "../../services/replayer/Replayer";
import ScriptsExecutionerService from "../../services/scriptsExecutioner/ScriptsExecutioner";
import { AppWorker } from "../../worker/Types";

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: {
    movingAverages: MovingAverage[]
    rsi: RSI;
  }
  meta?: { [key: string]: unknown };
}

interface MovingAverage {
  name: string;
  value: number;
  candlesAmount: number;
}

interface RSI {
  value: number;
  averageProfits: number;
  averageLoses: number;
}

interface State {
  readonly painterService: PainterService | null;
  readonly replayerService: ReplayerService | null;
  readonly scriptsExecutionerService: ScriptsExecutionerService | null;
  readonly data: Candle[];
  readonly isParsingData: boolean;
  readonly isReplayWidgetVisible: boolean;
  readonly isReplayActive: boolean;
  readonly isTradingPanelVisible: boolean;
  readonly isScriptsPanelVisible: boolean;
  readonly worker: AppWorker;
}

const ActionTypes = {
  SET_DATA: "GLOBAL_CONTEXT_SET_DATA",
  SET_IS_PARSING_DATA: "GLOBAL_CONTEXT_SET_IS_PARSING_DATA",
  SET_IS_REPLAY_WIDGET_VISIBLE: "GLOBAL_CONTEXT_SET_IS_REPLAY_WIDGET_VISIBLE",
  SET_IS_REPLAY_ACTIVE: "GLOBAL_CONTEXT_SET_IS_REPLAY_ACTIVE",
  SET_IS_TRADING_PANEL_VISIBLE: "GLOBAL_CONTEXT_SET_IS_TRADING_PANEL_VISIBLE",
  SET_IS_SCRIPTS_PANEL_VISIBLE: "GLOBAL_CONTEXT_SET_IS_SCRIPTS_PANEL_VISIBLE",
  SET_SERVICES: "GLOBAL_CONTEXT_SET_SERVICES",
};

export { ActionTypes };
export type { State, Candle, MovingAverage };
