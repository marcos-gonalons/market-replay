import { Order } from "../../../context/tradesContext/Types";
import { CandlesDisplayDimensions, PriceRange } from "../Types";

interface DrawOrdersParameters {
  ctx: CanvasRenderingContext2D;
  orders: Order[];
  priceRange: PriceRange;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: {
    market: string;
    limit: string;
    takeProfit: string;
    stopLoss: string;
  };
}

export function drawOrders({ ctx, orders, priceRange, candlesDisplayDimensions, colors }: DrawOrdersParameters): void {
  ctx.setLineDash([10, 5]);
  for (const { type, price, stopLoss, takeProfit } of orders) {
    if (isPriceWithinRange(price as number, priceRange)) {
      ctx.strokeStyle = type === "limit" ? colors.limit : colors.market;
      drawOrderLine(ctx, candlesDisplayDimensions.width, getPriceYCoord(candlesDisplayDimensions, priceRange, price));
    }

    if (stopLoss) {
      if (isPriceWithinRange(stopLoss, priceRange)) {
        ctx.strokeStyle = colors.stopLoss;
        drawOrderLine(
          ctx,
          candlesDisplayDimensions.width,
          getPriceYCoord(candlesDisplayDimensions, priceRange, stopLoss)
        );
      }
    }
    if (takeProfit) {
      if (isPriceWithinRange(takeProfit, priceRange)) {
        ctx.strokeStyle = colors.takeProfit;
        drawOrderLine(
          ctx,
          candlesDisplayDimensions.width,
          getPriceYCoord(candlesDisplayDimensions, priceRange, takeProfit)
        );
      }
    }
  }
  ctx.setLineDash([]);
}

function isPriceWithinRange(price: number, range: PriceRange): boolean {
  return price >= range.min && price <= range.max;
}

function drawOrderLine(ctx: CanvasRenderingContext2D, width: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.closePath();
}

function getPriceYCoord(
  candlesDisplayDimensions: CandlesDisplayDimensions,
  priceRange: PriceRange,
  price: number
): number {
  return (
    (candlesDisplayDimensions.height * (priceRange.max - (price as number))) / (priceRange.max - priceRange.min) + 0.5
  );
}
