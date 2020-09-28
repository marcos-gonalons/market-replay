interface ChartData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface State {
  readonly data: ChartData[];
  readonly isParsingData: boolean;
}

const ActionTypes = {
  SET_DATA: "DATA_CONTEXT_SET_DATA",
  SET_IS_PARSING_DATA: "DATA_CONTEXT_SET_IS_PARSING_DATA",
};

export { ActionTypes };
export type { State, ChartData };
