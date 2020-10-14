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
    ctx.lineTo(wickX, y - ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * wickDiff);
    ctx.stroke();
    ctx.closePath();

    // Bottom wick
    wickDiff = candle.low - (isPositive ? candle.open : candle.close);
    ctx.beginPath();
    ctx.moveTo(wickX, y + h);
    ctx.lineTo(wickX, y + h - ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * wickDiff);
    ctx.stroke();
    ctx.closePath();

    candleNumber++;
  }
}
