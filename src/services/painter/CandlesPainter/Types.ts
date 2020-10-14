import { Candle } from "../../../context/globalContext/Types";
import { CandlesDisplayDimensions, Colors, Range } from "../Types";

export interface DrawCandlesParameters {
  ctx: CanvasRenderingContext2D;
  dataStartIndex: number;
  dataEndIndex: number;
  data: Candle[];
  priceRange: Range;
  candleWidth: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["candle"];
}
