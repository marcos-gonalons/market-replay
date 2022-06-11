import { Candle } from "../../../context/globalContext/Types";
import { CandlesDisplayDimensions, Range } from "../Types";

export interface DrawIndicatorsParameters {
  ctx: CanvasRenderingContext2D;
  dataStartIndex: number;
  dataEndIndex: number;
  data: Candle[];
  priceRange: Range;
  candleWidth: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
}

