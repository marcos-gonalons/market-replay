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
  return (
    (candlesDisplayDimensions.height * (priceRange.max - (price as number))) / (priceRange.max - priceRange.min) + 0.5
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
  return priceRange.max - (priceRange.max - priceRange.min) * (yCoord / candlesDisplayDimensions.height);
}
