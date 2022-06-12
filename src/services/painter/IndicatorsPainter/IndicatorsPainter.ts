import { getYCoordOfPrice } from "../Utils/Utils";
import { DrawIndicatorsParameters } from "./Types";

export function drawIndicators({
  ctx,
  dataStartIndex,
  dataEndIndex,
  data,
  priceRange,
  candleWidth,
  candlesDisplayDimensions,
  colors
}: DrawIndicatorsParameters): void {

  drawMovingAverages();

  function drawMovingAverages(): void {
    const movingAveragesAmount = data[dataStartIndex].indicators.movingAverages.length;
    for (let _i = 0; _i < movingAveragesAmount; _i++) {
      ctx.beginPath();
      ctx.strokeStyle = colors.movingAverages[data[dataStartIndex].indicators.movingAverages[_i].name];
    
      let candleNumber = 0;
      for (let i = dataStartIndex; i < dataEndIndex; i++) {
        const x = candleWidth * candleNumber + candleWidth / 2;
    
        const y = getYCoordOfPrice({
          candlesDisplayDimensions,
          priceRange,
          price: data[i].indicators.movingAverages[_i].value,
        });
        ctx.lineTo(x, y);
    
        candleNumber++;
      }
    
      ctx.stroke();
    }
  }
}

