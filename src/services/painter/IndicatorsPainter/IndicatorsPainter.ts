import { drawMovingAverages } from "./MovingAverage";
import { drawRSI } from "./RSI";
import { DrawIndicatorsParameters } from "./Types";

export function drawIndicators(params: DrawIndicatorsParameters): void {

  drawMovingAverages(params);

  drawRSI(params);

}

