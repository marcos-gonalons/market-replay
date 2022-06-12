import { Candle } from "../../context/globalContext/Types";

export function AddIndicatorsData(candles: Candle[]) {
    const movingAveragesLengths: number[] = [10,20,50,100,200];

    for (const len of movingAveragesLengths) {
        if (len !== 200) continue;
         candles[candles.length-1].indicators.movingAverages.push({
            name: "SMA",
            value: getMovingAverage(len, candles),
            candlesAmount: len
        });
    }

    candles[candles.length-1].indicators.movingAverages.push({
        name: "EMA",
        value: getExponentialMovingAverage(200, candles, 2),
        candlesAmount: 200
    });
}

function getMovingAverage(candlesAmount: number, candles: Candle[]): number {
    let sum = 0;
    for (let j = candles.length - candlesAmount; j < candles.length; j++) {
      if (j < 0) continue;

      sum += candles[j].high;
    }

    return sum / candlesAmount;
}

function getExponentialMovingAverage(candlesAmount: number, candles: Candle[], smoothingFactor: number = 2): number {
    if (candles.length === 1) {
        return candles[0].high;
    }

    const multiplier = smoothingFactor / (candlesAmount+1);
    const previousEMA = candles[candles.length-2].indicators.movingAverages.find(ma => ma.name === "EMA");
    let previousValue = previousEMA ? previousEMA.value : candles[candles.length-2].high;

    return candles[candles.length-1].high * multiplier + (previousValue * (1-multiplier));
}
