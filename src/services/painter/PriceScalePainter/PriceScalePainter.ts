import { Candle } from "../../../context/globalContext/Types";
import { DEFAULT_FONT, MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX, PRICE_SCALE_WITH_IN_PX } from "../Constants";
import { CandlesDisplayDimensions, Colors, PriceRange } from "../Types";
import { getPriceOfYCoord, getYCoordOfPrice } from "../Utils/Utils";

interface DrawPriceScaleParameters {
  ctx: CanvasRenderingContext2D;
  canvasHeight: number;
  colors: Colors["priceScale"];
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: PriceRange;
}

export function drawPriceScale({
  ctx,
  canvasHeight,
  colors,
  candlesDisplayDimensions,
  priceRange,
}: DrawPriceScaleParameters): void {
  ctx.fillStyle = colors.background;
  ctx.fillRect(candlesDisplayDimensions.width, 0, PRICE_SCALE_WITH_IN_PX, candlesDisplayDimensions.height);

  ctx.fillStyle = colors.border;
  ctx.fillRect(candlesDisplayDimensions.width, 0, 2, canvasHeight);

  const priceRangeDiff = priceRange.max - priceRange.min;
  if (priceRangeDiff === 0) return;

  const nearestMultipleForRounding = getNearestMultipleForRounding(priceRangeDiff);
  const maxPriceRounded = Math.floor(priceRange.max / nearestMultipleForRounding) * nearestMultipleForRounding;
  const priceJump = parseFloat(
    (
      Math.ceil(
        priceRangeDiff / ((canvasHeight * MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX) / 1000) / nearestMultipleForRounding
      ) * nearestMultipleForRounding || 1
    ).toFixed(5)
  );

  let price = maxPriceRounded;
  while (price > priceRange.min) {
    const y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price });

    if (y > 20 && y < candlesDisplayDimensions.height - 20) {
      const finalPriceToDisplay =
        price.toString().split(".").length > 1 ? price.toFixed(5) : parseFloat(price.toFixed(5)).toString();
      ctx.fillRect(candlesDisplayDimensions.width, y, 10, 1);
      ctx.fillText(finalPriceToDisplay, candlesDisplayDimensions.width + 15, y);
    }

    price = price - priceJump;
  }
}

interface DrawPriceInPointerPositionParameters {
  ctx: CanvasRenderingContext2D;
  yCoord: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: PriceRange;
  highlightColors: { background: string; text: string };
}

export function drawPriceInPointerPosition({
  ctx,
  yCoord,
  candlesDisplayDimensions,
  priceRange,
  highlightColors,
}: DrawPriceInPointerPositionParameters): void {
  if (yCoord > candlesDisplayDimensions.height) return;

  const price = getPriceOfYCoord({ priceRange, candlesDisplayDimensions, yCoord });

  ctx.fillStyle = highlightColors.background;
  ctx.fillRect(candlesDisplayDimensions.width, yCoord - 12.5, PRICE_SCALE_WITH_IN_PX, 25);

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = highlightColors.text;

  ctx.fillText(price.toFixed(5).slice(0, 9), candlesDisplayDimensions.width + 15, yCoord + 1);
  ctx.font = DEFAULT_FONT;
}

interface DrawCurrentPriceInPriceScaleParams {
  ctx: CanvasRenderingContext2D;
  data: Candle[];
  priceRange: PriceRange;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["currentPrice"];
}
export function drawCurrentPriceInPriceScale({
  ctx,
  data,
  priceRange,
  candlesDisplayDimensions,
  colors,
}: DrawCurrentPriceInPriceScaleParams): void {
  const currentPrice = data[data.length - 1].close;

  if (currentPrice < priceRange.min || currentPrice > priceRange.max) {
    return;
  }

  const y = getYCoordOfPrice({
    candlesDisplayDimensions,
    priceRange,
    price: currentPrice,
  });
  const h = 25;

  ctx.fillStyle = colors.background;
  ctx.fillRect(candlesDisplayDimensions.width, y - h / 2, PRICE_SCALE_WITH_IN_PX, h);

  ctx.fillStyle = colors.text;
  ctx.fillText(currentPrice.toString(), candlesDisplayDimensions.width + 10, y);
}

function getNearestMultipleForRounding(priceRangeDiff: number): number {
  let nearestMultipleForRounding: number = 1;
  if (priceRangeDiff >= 10) {
    const diffWithoutDecimals = priceRangeDiff.toString().split(".")[0];
    nearestMultipleForRounding = parseInt(`1${"0".repeat(diffWithoutDecimals.length - 2)}`);
  } else {
    let amountOfZeros: number = 0;
    if (priceRangeDiff < 1) {
      amountOfZeros = 1;
      const decimalPart = priceRangeDiff.toString().split(".")[1];
      for (let i = 0; i < decimalPart.length; i++) {
        if (decimalPart[i] === "0") {
          amountOfZeros++;
        } else {
          break;
        }
      }
    }
    nearestMultipleForRounding = parseFloat(`0.${"0".repeat(amountOfZeros)}1`);
  }
  return nearestMultipleForRounding;
}
