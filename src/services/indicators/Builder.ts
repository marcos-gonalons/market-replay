import { Candle } from "../../context/globalContext/Types";

export function AddIndicatorsData(candles: Candle[]) {
/*
    const smaLengths: number[] = [10,20,50,100,200];

    for (const len of smaLengths) {
         candles[candles.length-1].indicators.movingAverages.push({
            name: "SMA",
            value: getMovingAverage(len, candles),
            candlesAmount: len
        });
    }
*/
    const emaLengths: number[] = [9,21,200];
    for (const len of emaLengths) {
         candles[candles.length-1].indicators.movingAverages.push({
            name: "EMA",
            value: getExponentialMovingAverage(len, candles, 2),
            candlesAmount: len
        });
    }
}
/*
function getMovingAverage(candlesAmount: number, candles: Candle[]): number {
    let sum = 0;
    for (let j = candles.length - candlesAmount; j < candles.length; j++) {
      if (j < 0) continue;

      sum += candles[j].close;
    }

    return sum / candlesAmount;
}
*/
function getExponentialMovingAverage(candlesAmount: number, candles: Candle[], smoothingFactor: number = 2): number {
    if (candles.length === 1) {
        return candles[0].close;
    }

    const multiplier = smoothingFactor / (candlesAmount+1);
    const previousEMA = candles[candles.length-2].indicators.movingAverages.find(ma => ma.name === "EMA" && ma.candlesAmount === candlesAmount);
    let previousValue = previousEMA ? previousEMA.value : candles[candles.length-2].close;

    return candles[candles.length-1].close * multiplier + (previousValue * (1-multiplier));
}
