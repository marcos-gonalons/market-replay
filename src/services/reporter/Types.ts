import { Trade } from "../../context/tradesContext/Types";

export interface Report {
  [key: string]: ReportData;
}

export interface ReportData {
  groupValue: number;
  total: number;
  positives: number;
  negatives: number;
  successPercentage: number;
  profits: number;
  maxDrawdown?: number;
  trades: Trade[];
}
