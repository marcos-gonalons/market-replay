import { CANDLES_DISPLAY_PADDING_IN_PERCENTAGE } from "../Constants";
import { CandlesDisplayDimensions, Range } from "../Types";

export function getYCoordOfPrice({
  candlesDisplayDimensions,
  priceRange,
  price,
}: {
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: Range;
  price: number;
}): number {
  const paddingInPx = candlesDisplayDimensions.height * CANDLES_DISPLAY_PADDING_IN_PERCENTAGE;
  return (
    ((candlesDisplayDimensions.height - paddingInPx * 2) * (priceRange.max - (price as number))) /
      (priceRange.max - priceRange.min) +
    0.5 +
    paddingInPx
  );
}

export function getPriceOfYCoord({
  priceRange,
  yCoord,
  candlesDisplayDimensions,
}: {
  priceRange: Range;
  yCoord: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
}): number {
  const paddingInPx = candlesDisplayDimensions.height * CANDLES_DISPLAY_PADDING_IN_PERCENTAGE;
  return (
    priceRange.max -
    (priceRange.max - priceRange.min) * ((yCoord - paddingInPx) / (candlesDisplayDimensions.height - paddingInPx * 2))
  );
}
