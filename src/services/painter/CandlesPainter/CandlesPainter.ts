import { Candle } from "../../../context/globalContext/Types";
import { CANDLES_DISPLAY_PADDING_IN_PERCENTAGE } from "../Constants";
import { getYCoordOfPrice } from "../Utils/Utils";
import { DrawCandlesParameters } from "./Types";

type Position = {x: number, y: number};
type Wick = { startingPosition: Position; endingPosition: Position };
type CandleWicks = { top: Wick; bottom: Wick; }
interface CandleDrawing {
  body: {x: number; y: number; h: number; w: number};
  wicks: CandleWicks;
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
}: DrawCandlesParameters): void {
  let candleNumber = 0;
  const priceRangeDiff = priceRange.max - priceRange.min || 100;
  const paddingInPx = candlesDisplayDimensions.height * CANDLES_DISPLAY_PADDING_IN_PERCENTAGE;
  for (let i = dataStartIndex; i < dataEndIndex; i++) {
    const candle = data[i];
    const isPositive = candle.close >= candle.open;

    const candleBody = drawBody(candle, isPositive);
    const candleWicks = drawWicks(candle, isPositive, candleBody);

    if (candle.meta) {
      drawCandleMeta(
        candle, {
          body: candleBody,
          wicks: candleWicks
        });
    }

    candleNumber++;
  }

  function drawBody(candle: Candle, isPositive: boolean): CandleDrawing["body"] {
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

    ctx.fillStyle = isPositive ? colors.body.positive : colors.body.negative;
    ctx.fillRect(x, y, w, h);

    return {x,y,w,h};
  }

  function drawWicks(candle: Candle, isPositive: boolean, candleBody: CandleDrawing["body"]): CandleWicks {
    ctx.strokeStyle = isPositive ? colors.wick.positive : colors.wick.negative;

    // Top wick
    let wickDiffInPrice = candle.high - (isPositive ? candle.close : candle.open);

    let topWickStartingPosition: Position = { x: candleBody.x + candleWidth / 2, y: candleBody.y};
    let topWickEndingPosition: Position = { x: topWickStartingPosition.x, y: candleBody.y - ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * wickDiffInPrice};

    ctx.beginPath();
    ctx.moveTo(topWickStartingPosition.x, topWickStartingPosition.y);
    ctx.lineTo(topWickEndingPosition.x, topWickEndingPosition.y);
    ctx.stroke();
    ctx.closePath();

    // Bottom wick
    wickDiffInPrice = candle.low - (isPositive ? candle.open : candle.close);
    
    let bottomWickStartingPosition = { x: topWickStartingPosition.x, y: candleBody.y + candleBody.h};
    let bottomWickEndingPosition = { x: bottomWickStartingPosition.x, y: candleBody.y + candleBody.h - ((candlesDisplayDimensions.height - paddingInPx * 2) / priceRangeDiff) * wickDiffInPrice};

    ctx.beginPath();
    ctx.moveTo(bottomWickStartingPosition.x, bottomWickStartingPosition.y);
    ctx.lineTo(bottomWickEndingPosition.x, bottomWickEndingPosition.y);
    ctx.stroke();
    ctx.closePath();

    return {
      top: { startingPosition: topWickStartingPosition, endingPosition: topWickEndingPosition },
      bottom: { startingPosition: bottomWickStartingPosition, endingPosition: bottomWickEndingPosition }
    }
  }


  function drawCandleMeta(candle: Candle, candleDrawing: CandleDrawing) {
    if (!candle.meta!.type) {
      return;
    }

    if (candle.meta!.type === "resistance") {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(
        candleDrawing.body.x + candleWidth / 2,
        candleDrawing.wicks.top.endingPosition.y, 10, 0, 2 * Math.PI
      );
      ctx.fill();
    }
    if (candle.meta!.type === "support") {
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(
        candleDrawing.body.x + candleWidth / 2,
        candleDrawing.wicks.bottom.endingPosition.y, 10, 0, 2 * Math.PI
      );
      ctx.fill();
    }
  }
}

