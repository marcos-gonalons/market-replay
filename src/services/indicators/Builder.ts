import { Candle } from "../../context/globalContext/Types";
import { addEmas } from "./EMA";
import { addRSI } from "./RSI";

export function AddIndicatorsData(candles: Candle[]) {
    addEmas(candles);
    addRSI(candles);
}
