import { ChartData } from "../../../context/dataContext/Types";
import { PriceRange } from "../Types";

interface Parameters {
  ctx: CanvasRenderingContext2D;
  dataStartIndex: number;
  dataEndIndex: number;
  data: ChartData[];
  priceRange: PriceRange;
  candleWidth: number;
  candlesDisplayDimensions: { width: number; height: number };
  colors: {
    body: {
      positive: string;
      negative: string;
    };
    wick: {
      positive: string;
      negative: string;
    };
  };
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
    const y =
      ((priceRange.max - (isPositive ? candle.close : candle.open)) / priceRangeDiff) * candlesDisplayDimensions.height;
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
