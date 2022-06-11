import { Candle } from "../../context/globalContext/Types";

export function AddIndicatorsData(candles: Candle[]) {

    candles[candles.length-1].indicators.movingAverages.push({
        value: getMovingAverage(10, candles),
        candlesAmount: 10
    });

    candles[candles.length-1].indicators.movingAverages.push({
        value: getMovingAverage(100, candles),
        candlesAmount: 100
    });

}

function getMovingAverage(candlesAmount: number, candles: Candle[]) {
    let sum = 0;
    for (let j = candles.length - candlesAmount; j < candles.length; j++) {
      if (j < 0) continue;

      sum += candles[j].high;
    }

    return sum / candlesAmount;
}