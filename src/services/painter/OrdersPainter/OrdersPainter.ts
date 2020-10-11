import { ChartData } from "../../../context/globalContext/Types";
import { Order } from "../../../context/tradesContext/Types";
import { DEFAULT_FONT } from "../Constants";
import { CandlesDisplayDimensions, Colors, PriceRange } from "../Types";
import { getYCoordOfPrice } from "../Utils/Utils";

interface DrawOrdersParameters {
  ctx: CanvasRenderingContext2D;
  orders: Order[];
  priceRange: PriceRange;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["orders"];
  currentCandle: ChartData;
}

export function drawOrders({
  ctx,
  orders,
  priceRange,
  candlesDisplayDimensions,
  colors,
  currentCandle,
}: DrawOrdersParameters): void {
  let y: number;
  ctx.font = "bold 15px Arial";
  for (const { type, price, stopLoss, takeProfit, size, createdAt } of orders) {
    if (createdAt > currentCandle.timestamp) continue;

    if (isPriceWithinRange(price as number, priceRange)) {
      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price });
      drawOrderLine(ctx, candlesDisplayDimensions.width, y, type === "limit" ? colors.limit : colors.market);
      drawOrderData(ctx, y, size.toString(), candlesDisplayDimensions, colors, type);
    }

    if (stopLoss) {
      if (isPriceWithinRange(stopLoss, priceRange)) {
        drawOrderLine(
          ctx,
          candlesDisplayDimensions.width,
          getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: stopLoss }),
          colors.stopLoss
        );
      }
    }
    if (takeProfit) {
      if (isPriceWithinRange(takeProfit, priceRange)) {
        drawOrderLine(
          ctx,
          candlesDisplayDimensions.width,
          getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: takeProfit }),
          colors.takeProfit
        );
      }
    }
  }
  ctx.font = DEFAULT_FONT;
}

function isPriceWithinRange(price: number, range: PriceRange): boolean {
  return price >= range.min && price <= range.max;
}

function drawOrderLine(ctx: CanvasRenderingContext2D, width: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.setLineDash([5, 2]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.closePath();
  ctx.setLineDash([]);
}

function drawOrderData(
  ctx: CanvasRenderingContext2D,
  y: number,
  text: string,
  candlesDisplayDimensions: CandlesDisplayDimensions,
  colors: Colors["orders"],
  orderType: Order["type"]
): void {
  const height = 30;
  const padding = 10;
  const textWidth = ctx.measureText(text).width;
  const x = candlesDisplayDimensions.width - 100 - textWidth;

  ctx.fillStyle = colors.background;
  ctx.fillRect(x, y - height / 2, textWidth + padding * 2, height);

  ctx.strokeStyle = orderType === "limit" ? colors.limit : colors.market;
  ctx.strokeRect(x, y - height / 2, textWidth + padding * 2, height);

  ctx.fillStyle = colors.text;
  ctx.fillText(text, x + padding, y + 1);
}
