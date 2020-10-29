export interface Report {
  [key: string]: {
    total: number;
    positives: number;
    negatives: number;
    successPercentage: number;
    profits: number;
  };
}
