import { CandlesDisplayDimensions, Coords } from "../Types";

interface Parameters {
  ctx: CanvasRenderingContext2D;
  color: string;
  mouseCoords: Coords;
  candlesDisplayDimensions: CandlesDisplayDimensions;
}

export function drawPointerLines({ ctx, color, mouseCoords, candlesDisplayDimensions }: Parameters): void {
  ctx.setLineDash([10, 5]);
  ctx.strokeStyle = color;

  if (mouseCoords.y < candlesDisplayDimensions.height) {
    ctx.beginPath();
    ctx.moveTo(0, mouseCoords.y + 0.5);
    ctx.lineTo(candlesDisplayDimensions.width, mouseCoords.y + 0.5);
    ctx.stroke();
    ctx.closePath();
  }
  if (mouseCoords.x < candlesDisplayDimensions.width) {
    ctx.beginPath();
    ctx.moveTo(mouseCoords.x + 0.5, 0);
    ctx.lineTo(mouseCoords.x + 0.5, candlesDisplayDimensions.height);
    ctx.stroke();
    ctx.closePath();
  }

  ctx.setLineDash([]);
}
