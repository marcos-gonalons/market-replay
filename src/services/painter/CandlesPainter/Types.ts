import { Candle } from "../../../context/globalContext/Types";
import { CandlesDisplayDimensions, Colors, PriceRange } from "../Types";

export interface DrawCandlesParameters {
  ctx: CanvasRenderingContext2D;
  dataStartIndex: number;
  dataEndIndex: number;
  data: Candle[];
  priceRange: PriceRange;
  candleWidth: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["candle"];
}
