import { CANDLES_DISPLAY_PADDING_IN_PERCENTAGE } from "../Constants";
import { getYCoordOfPrice } from "../Utils/Utils";
import { DrawCandlesParameters } from "./Types";

export function drawCandles({
  ctx,
  dataStartIndex,
  dataEndIndex,
  data,
  priceRange,
  candleWidth,
  candlesDisplayDimensions,
  colors,
}: DrawCandlesParameters): void {
  let candleNumber = 0;
  const priceRangeDiff = priceRange.max - priceRange.min || 100;
  const paddingInPx = candlesDisplayDimensions.height * CANDLES_DISPLAY_PADDING_IN_PERCENTAGE;
  for (let i = dataStartIndex; i < dataEndIndex; i++) {
    const candle = data[i];
    const isPositive = candle.close >= candle.open;

    const x = candleWidth * candleNumber;
    const y = getYCoordOfPrice({
      candlesDisplayDimensions,
      priceRange,
      price: isPositive ? candle.close : candle.open,
    });

    const w = candleWidth;
    const h =
      ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * Math.abs(candle.open - candle.close) ||
      1;

    // Candle body
    ctx.fillStyle = isPositive ? colors.body.positive : colors.body.negative;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = isPositive ? colors.wick.positive : colors.wick.negative;

    // Top wick
    let wickDiff = candle.high - (isPositive ? candle.close : candle.open);
    const wickX = x + candleWidth / 2;
    ctx.beginPath();
    ctx.moveTo(wickX, y);
    const topWickEndPosition = y - ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * wickDiff;
    ctx.lineTo(wickX, topWickEndPosition);
    ctx.stroke();
    ctx.closePath();

    // Bottom wick
    wickDiff = candle.low - (isPositive ? candle.open : candle.close);
    ctx.beginPath();
    ctx.moveTo(wickX, y + h);
    const bottomWickEndPosition = y + h - ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * wickDiff;
    ctx.lineTo(wickX, bottomWickEndPosition);
    ctx.stroke();
    ctx.closePath();

    if (candle.meta && candle.meta.type) {
      if (candle.meta.type === "resistance") {
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(x + candleWidth / 2, topWickEndPosition, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (candle.meta.type === "support") {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(x + candleWidth / 2, bottomWickEndPosition, 10, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    candleNumber++;
  }
}
