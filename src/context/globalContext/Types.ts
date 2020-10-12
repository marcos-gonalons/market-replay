import PainterService from "../../services/painter/Painter";
import ReplayerService from "../../services/painter/Replayer/Replayer";

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface State {
  readonly painterService: PainterService;
  readonly replayerService: ReplayerService;
  readonly data: Candle[];
  readonly isParsingData: boolean;
  readonly isReplayWidgetVisible: boolean;
  readonly isReplayActive: boolean;
  readonly isTradingPanelVisible: boolean;
  readonly isScriptsPanelVisible: boolean;
}

const ActionTypes = {
  SET_DATA: "GLOBAL_CONTEXT_SET_DATA",
  SET_IS_PARSING_DATA: "GLOBAL_CONTEXT_SET_IS_PARSING_DATA",
  SET_IS_REPLAY_WIDGET_VISIBLE: "GLOBAL_CONTEXT_SET_IS_REPLAY_WIDGET_VISIBLE",
  SET_IS_REPLAY_ACTIVE: "GLOBAL_CONTEXT_SET_IS_REPLAY_ACTIVE",
  SET_IS_TRADING_PANEL_VISIBLE: "GLOBAL_CONTEXT_SET_IS_TRADING_PANEL_VISIBLE",
  SET_IS_SCRIPTS_PANEL_VISIBLE: "GLOBAL_CONTEXT_SET_IS_SCRIPTS_PANEL_VISIBLE",
};

export { ActionTypes };
export type { State, Candle };
