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

export interface DrawOrderLineParameters {
  ctx: CanvasRenderingContext2D;
  width: number;
  y: number;
  color: string;
}

export interface DrawOrderDataParameters {
  ctx: CanvasRenderingContext2D;
  y: number;
  orderSize: string;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["orders"];
  order: Order;
  currentCandle: Candle;
}

export interface DrawTakeProfitOrStopLossBoxParameters {
  ctx: CanvasRenderingContext2D;
  type: "tp" | "sl";
  colors: Colors["orders"];
  y: number;
  price: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
}
