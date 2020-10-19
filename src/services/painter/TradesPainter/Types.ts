import { Candle } from "../../../context/globalContext/Types";
import { Trade } from "../../../context/tradesContext/Types";
import { Colors, CandlesDisplayDimensions, Range } from "../Types";

export interface DrawFinishedTradesParameters {
  ctx: CanvasRenderingContext2D;
  trades: Trade[];
  colors: Colors["trades"];
  candlesDisplayDimensions: CandlesDisplayDimensions;
  priceRange: Range;
  canvasHeight: number;
  dataStartIndex: number;
  dataEndIndex: number;
  candleWidth: number;
  data: Candle[];
}
