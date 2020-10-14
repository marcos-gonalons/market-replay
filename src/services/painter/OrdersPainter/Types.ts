import { Candle } from "../../../context/globalContext/Types";
import { Order } from "../../../context/tradesContext/Types";
import { CandlesDisplayDimensions, Colors, Range } from "../Types";

export interface DrawOrdersParameters {
  ctx: CanvasRenderingContext2D;
  orders: Order[];
  priceRange: Range;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["orders"];
  currentCandle: Candle;
}
