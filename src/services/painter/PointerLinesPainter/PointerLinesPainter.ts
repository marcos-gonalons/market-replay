import { DrawPointerLinesParameters } from "./Types";

export function drawPointerLines({
  ctx,
  color,
  mouseCoords,
  candlesDisplayDimensions,
}: DrawPointerLinesParameters): void {
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
