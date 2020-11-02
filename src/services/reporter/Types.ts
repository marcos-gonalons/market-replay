export interface Report {
  [key: string]: ReportData;
}

export interface ReportData {
  total: number;
  positives: number;
  negatives: number;
  successPercentage: number;
  profits: number;
}
