import { Candle } from "../../../context/globalContext/Types";
import { CandlesDisplayDimensions, Colors, Range } from "../Types";

export interface DrawPriceScaleParameters {
  ctx: CanvasRenderingContext2D;
  canvasHeight: number;
  colors: Colors["priceScale"];
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: Range;
}

export interface DrawPriceInPointerPositionParameters {
  ctx: CanvasRenderingContext2D;
  yCoord: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: Range;
  highlightColors: { background: string; text: string };
}

export interface DrawCurrentPriceInPriceScaleParams {
  ctx: CanvasRenderingContext2D;
  data: Candle[];
  priceRange: Range;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["currentPrice"];
}
