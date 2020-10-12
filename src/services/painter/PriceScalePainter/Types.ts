import { CandlesDisplayDimensions, Colors, PriceRange } from "../Types";

export interface DrawPriceScaleParameters {
  ctx: CanvasRenderingContext2D;
  canvasHeight: number;
  colors: Colors["priceScale"];
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: PriceRange;
}

export interface DrawPriceInPointerPositionParameters {
  ctx: CanvasRenderingContext2D;
  yCoord: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: PriceRange;
  highlightColors: { background: string; text: string };
}
