import { Candle } from "../../../context/globalContext/Types";
import { Order } from "../../../context/tradesContext/Types";
import { CandlesDisplayDimensions, Colors, PriceRange } from "../Types";

export interface DrawOrdersParameters {
  ctx: CanvasRenderingContext2D;
  orders: Order[];
  priceRange: PriceRange;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["orders"];
  currentCandle: Candle;
}
