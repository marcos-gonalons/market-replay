import { Trade } from "../context/tradesContext/Types";
import { COMMISSIONS } from "../services/painter/Constants";

export function getNSigma(nSigma: number, set: number[]): number {
  if (!set.length) return 0;

  const avg = set.reduce((a, b) => a + b) / set.length;
  const variance = set.map((n) => Math.pow(n - avg, 2)).reduce((a, b) => a + b) / set.length;
  const stdDeviation = Math.sqrt(variance);

  return nSigma * stdDeviation + avg;
}

export function getNSigmaWithWeightedAverage(nSigma: number, weights: number[], data: number[]): number {
  if (!weights.length || !data.length) return 0;

  const weightedData: number[] = [];
  for (let i = 0; i < data.length; i++) {
    weightedData.push(weights[i] * data[i]);
  }
  const weightDataSum = weights.reduce((a, b) => a + b);

  const weightedAverage = weightedData.reduce((a, b) => a + b) / weightDataSum;

  const variance = data.map((n) => Math.pow(n - weightedAverage, 2)).reduce((a, b) => a + b) / weightDataSum;
  const stdDeviation = Math.sqrt(variance);

  return nSigma * stdDeviation + weightedAverage;
}

export function prependZero(el: number | string): number | string {
  return el.toString().length === 1 ? `0${el}` : el;
}

export function getMinutesAsHalfAnHour(minutes: number): string {
  if (minutes < 30) return "00";
  return "30";
}

export function debugLog(enabled: boolean, ...msgs: unknown[]): void {
  if (!enabled) return;
  console.log(...msgs);
}

export function adjustTradeResultWithRollover(trade: Trade, rollover: number): void {
  let diffInDays = Math.floor((trade.endDate.valueOf() - trade.startDate.valueOf()) / 1000 / 60 / 60 / 24);
  if (diffInDays > 0) {
    diffInDays--;
  }
  trade.result = trade.result - diffInDays * rollover;
}

export function addCommissions(trade: Trade): void {
  trade.result = trade.result - (COMMISSIONS * trade.startPrice * trade.size + COMMISSIONS * trade.endPrice * trade.size);
}
