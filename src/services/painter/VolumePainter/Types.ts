import { Candle } from "../../../context/globalContext/Types";
import { Colors, Range } from "../Types";

export interface DrawVolumeParameters {
  ctx: CanvasRenderingContext2D;
  data: Candle[];
  canvasHeight: number;
  dataStartIndex: number;
  dataEndIndex: number;
  candleWidth: number;
  colors: Colors["volume"];
  volumeRange: Range;
}
