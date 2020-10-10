import { ChartData } from "../../../context/globalContext/Types";
import { CandlesDisplayDimensions, Colors, PriceRange } from "../Types";
import { getYCoordOfPrice } from "../Utils/Utils";

interface Parameters {
  ctx: CanvasRenderingContext2D;
  dataStartIndex: number;
  dataEndIndex: number;
  data: ChartData[];
  priceRange: PriceRange;
  candleWidth: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["candle"];
}

export function drawCandles({
  ctx,
  dataStartIndex,
  dataEndIndex,
  data,
  priceRange,
  candleWidth,
  candlesDisplayDimensions,
  colors,
}: Parameters): void {
  let candleNumber = 0;
  const priceRangeDiff = priceRange.max - priceRange.min || 100;
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
    const h = (candlesDisplayDimensions.height / priceRangeDiff) * Math.abs(candle.open - candle.close) || 1;

    // Candle body
    ctx.fillStyle = isPositive ? colors.body.positive : colors.body.negative;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = isPositive ? colors.wick.positive : colors.wick.negative;

    // Top wick
    let wickDiff = candle.high - (isPositive ? candle.close : candle.open);
    const wickX = x + candleWidth / 2;
    ctx.beginPath();
    ctx.moveTo(wickX, y);
    ctx.lineTo(wickX, y - (candlesDisplayDimensions.height / priceRangeDiff) * wickDiff);
    ctx.stroke();
    ctx.closePath();

    // Bottom wick
    wickDiff = candle.low - (isPositive ? candle.open : candle.close);
    ctx.beginPath();
    ctx.moveTo(wickX, y + h);
    ctx.lineTo(wickX, y + h - (candlesDisplayDimensions.height / priceRangeDiff) * wickDiff);
    ctx.stroke();
    ctx.closePath();

    candleNumber++;
  }
}
