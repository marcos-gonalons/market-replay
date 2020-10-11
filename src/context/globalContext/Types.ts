import PainterService from "../../services/painter/Painter";

interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface State {
  readonly painterService: PainterService;
  readonly data: ChartData[];
  readonly isParsingData: boolean;
  readonly isReplayWidgetVisible: boolean;
  readonly isReplayActive: boolean;
  readonly isTradingPanelVisible: boolean;
}

const ActionTypes = {
  SET_PAINTER_SERVICE: "GLOBAL_CONTEXT_SET_PAINTER_SERVICE",
  SET_DATA: "GLOBAL_CONTEXT_SET_DATA",
  SET_IS_PARSING_DATA: "GLOBAL_CONTEXT_SET_IS_PARSING_DATA",
  SET_IS_REPLAY_WIDGET_VISIBLE: "GLOBAL_CONTEXT_SET_IS_REPLAY_WIDGET_VISIBLE",
  SET_IS_REPLAY_ACTIVE: "GLOBAL_CONTEXT_SET_IS_REPLAY_ACTIVE",
  SET_IS_TRADING_PANEL_VISIBLE: "GLOBAL_CONTEXT_SET_IS_TRADING_PANEL_VISIBLE",
};

export { ActionTypes };
export type { State, ChartData };
