import { Candle } from "../../context/globalContext/Types";

export function AddIndicatorsData(candles: Candle[]) {
    const movingAveragesLengths: number[] = [10,20,50,100,200];

    for (const len of movingAveragesLengths) {
        if (len !== 200) continue;
         candles[candles.length-1].indicators.movingAverages.push({
            value: getMovingAverage(len, candles),
            candlesAmount: len
        });
    }
}

function getMovingAverage(candlesAmount: number, candles: Candle[]) {
    let sum = 0;
    for (let j = candles.length - candlesAmount; j < candles.length; j++) {
      if (j < 0) continue;

      sum += candles[j].high;
    }

    return sum / candlesAmount;
}