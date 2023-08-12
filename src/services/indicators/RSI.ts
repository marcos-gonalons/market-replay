import { Candle } from "../../context/globalContext/Types";

const RSI_PERIODS = 14;

export function addRSI(candles: Candle[]) {
    if (candles.length <= RSI_PERIODS) {
        return;
    }

    const lastCandle = candles[candles.length - 1];

    if (candles.length === RSI_PERIODS+1) {
        let profits = 0;
        let losses = 0;
        for (let i = 0; i < RSI_PERIODS; i++) {
            const candle = candles[i];
            const diff = Math.abs(candle.open - candle.close);
            if (candle.close > candle.open) {
                profits = profits + diff;
            } else {
                losses = losses + diff;
            }
        }
    
        const averageProfits = profits / RSI_PERIODS;
        const averageLoses = losses / RSI_PERIODS;
    
        const relativeStrength = averageProfits / averageLoses;

        lastCandle.indicators.rsi = {
            value: 100 - 100/(1+relativeStrength),
            averageLoses,
            averageProfits
        } 
    }

    if (candles.length > RSI_PERIODS+1) {
        const previousRSI = candles[candles.length - 2].indicators.rsi;

        let averageProfits = 0;
        let averageLoses = 0;
        const diff = Math.abs(lastCandle.open - lastCandle.close);
        if (lastCandle.close > lastCandle.open) {
            averageProfits = (previousRSI.averageProfits * (RSI_PERIODS-1) + diff) / RSI_PERIODS;
            averageLoses = (previousRSI.averageLoses * (RSI_PERIODS-1) + 0) / RSI_PERIODS;
        } else {
            averageProfits = (previousRSI.averageProfits * (RSI_PERIODS-1) + 0) / RSI_PERIODS;
            averageLoses = (previousRSI.averageLoses * (RSI_PERIODS-1) + diff) / RSI_PERIODS;
        }

        const relativeStrength = averageProfits / averageLoses;
        
        lastCandle.indicators.rsi = {
            value: 100 - 100/(1+relativeStrength),
            averageLoses,
            averageProfits
        }
    }
}