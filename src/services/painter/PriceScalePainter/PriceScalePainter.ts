import { MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX, PRICE_SCALE_WITH_IN_PX } from "../Constants";
import { PriceRange } from "../Types";

interface Parameters {
  ctx: CanvasRenderingContext2D;
  canvasHeight: number;
  colors: { background: string; border: string };
  candlesDisplayDimensions: { width: number; height: number };
  priceRange: PriceRange;
}

export default function drawPriceScale({
  ctx,
  canvasHeight,
  colors,
  candlesDisplayDimensions,
  priceRange,
}: Parameters): void {
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
