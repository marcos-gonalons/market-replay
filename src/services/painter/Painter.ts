import { ChartData } from "../../types/ChartData";

export function draw(data: ChartData[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  if (data.length === 0) return;

  ctx.fillStyle = "rgb(200, 0, 0)";
  ctx.fillRect(10, 10, 10, 200);

  console.log(data[1]);
  console.log(canvas);
}
