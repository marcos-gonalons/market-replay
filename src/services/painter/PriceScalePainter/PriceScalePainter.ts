import { DEFAULT_FONT, MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX, PRICE_SCALE_WITH_IN_PX } from "../Constants";
import { CandlesDisplayDimensions, PriceRange } from "../Types";

interface DrawPriceScaleParameters {
  ctx: CanvasRenderingContext2D;
  canvasHeight: number;
  colors: { background: string; border: string };
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
    const y = (candlesDisplayDimensions.height * (priceRange.max - price)) / priceRangeDiff;

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
  mousePointerY: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: PriceRange;
  highlightColors: { background: string; text: string };
}

export function drawPriceInPointerPosition({
  ctx,
  mousePointerY,
  candlesDisplayDimensions,
  priceRange,
  highlightColors,
}: DrawPriceInPointerPositionParameters): void {
  if (mousePointerY > candlesDisplayDimensions.height) return;

  const price = priceRange.max - (priceRange.max - priceRange.min) * (mousePointerY / candlesDisplayDimensions.height);

  ctx.fillStyle = highlightColors.background;
  ctx.fillRect(candlesDisplayDimensions.width, mousePointerY - 12.5, PRICE_SCALE_WITH_IN_PX, 25);

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = highlightColors.text;
  ctx.fillText(price.toFixed(5), candlesDisplayDimensions.width + 15, mousePointerY + 1);
  ctx.font = DEFAULT_FONT;
}
