import { CandlesDisplayDimensions, Coords } from "../Types";

export interface DrawPointerLinesParameters {
  ctx: CanvasRenderingContext2D;
  color: string;
  mouseCoords: Coords;
  candlesDisplayDimensions: CandlesDisplayDimensions;
}
