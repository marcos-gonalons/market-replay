import { Candle } from "../../../context/globalContext/Types";
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
  currentCandle: Candle;
}

const boxMargin = 100;
const boxHeight = 30;
const boxPadding = 10;

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
  for (const order of orders) {
    if (order.createdAt > currentCandle.timestamp) continue;

    if (isPriceWithinRange(order.price as number, priceRange)) {
      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: order.price });
      drawOrderLine({
        ctx,
        width: candlesDisplayDimensions.width,
        y,
        color: order.type === "limit" ? colors.limit : colors.market,
      });
      drawOrderData({
        ctx,
        y,
        orderSize: order.size.toString(),
        candlesDisplayDimensions,
        colors,
        order,
        currentCandle,
      });
    }

    if (order.stopLoss && isPriceWithinRange(order.stopLoss, priceRange)) {
      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: order.stopLoss });
      drawOrderLine({
        ctx,
        width: candlesDisplayDimensions.width,
        y,
        color: colors.stopLoss,
      });
      drawTakeProfitOrStopLossBox({
        ctx,
        type: "sl",
        y,
        colors,
        candlesDisplayDimensions,
        price: order.stopLoss,
      });
    }
    if (order.takeProfit && isPriceWithinRange(order.takeProfit, priceRange)) {
      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: order.takeProfit });
      drawOrderLine({
        ctx,
        width: candlesDisplayDimensions.width,
        y,
        color: colors.takeProfit,
      });
      drawTakeProfitOrStopLossBox({
        ctx,
        type: "tp",
        y,
        colors,
        candlesDisplayDimensions,
        price: order.takeProfit,
      });
    }
  }
  ctx.font = DEFAULT_FONT;
}

function isPriceWithinRange(price: number, range: PriceRange): boolean {
  return price >= range.min && price <= range.max;
}

interface DrawOrderLineParameters {
  ctx: CanvasRenderingContext2D;
  width: number;
  y: number;
  color: string;
}
function drawOrderLine({ ctx, width, y, color }: DrawOrderLineParameters): void {
  ctx.strokeStyle = color;
  ctx.setLineDash([5, 2]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.closePath();
  ctx.setLineDash([]);
}

interface DrawOrderDataParameters {
  ctx: CanvasRenderingContext2D;
  y: number;
  orderSize: string;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  colors: Colors["orders"];
  order: Order;
  currentCandle: Candle;
}
function drawOrderData({
  ctx,
  y,
  orderSize,
  candlesDisplayDimensions,
  colors,
  order,
  currentCandle,
}: DrawOrderDataParameters): void {
  ctx.strokeStyle = order.type === "limit" ? colors.limit : colors.market;
  const boxY = y - boxHeight / 2;

  const closeOrderText = "X";
  const closeOrderTextWidth = ctx.measureText(closeOrderText).width;

  let x = candlesDisplayDimensions.width - boxMargin - closeOrderTextWidth;
  ctx.fillStyle = colors.text;
  ctx.fillRect(x, boxY, closeOrderTextWidth + boxPadding * 2, boxHeight);
  ctx.strokeRect(x, boxY, closeOrderTextWidth + boxPadding * 2, boxHeight);
  ctx.fillStyle = colors.background;
  ctx.fillText(closeOrderText, x + boxPadding, y + 1);

  if (order.type === "market") {
    let result = parseFloat(((currentCandle.close - order.price) * order.size).toFixed(2));
    result = order.position === "short" ? -result : result;
    const resultText = `${result > 0 ? "+" : ""}${result.toLocaleString()}`;
    const resultTextWidth = ctx.measureText(resultText).width;
    x = x - resultTextWidth - boxPadding * 2;
    ctx.fillStyle = colors.background;
    ctx.fillRect(x, boxY, resultTextWidth + boxPadding * 2, boxHeight);
    ctx.strokeRect(x, boxY, resultTextWidth + boxPadding * 2, boxHeight);
    ctx.fillStyle = result >= 0 ? colors.buyText : colors.sellText;
    ctx.fillText(resultText, x + boxPadding, y + 1);
  }

  const orderSizeTextWidth = ctx.measureText(orderSize).width;
  x = x - orderSizeTextWidth - boxPadding * 2;
  ctx.fillStyle = colors.background;
  ctx.fillRect(x, boxY, orderSizeTextWidth + boxPadding * 2, boxHeight);
  ctx.strokeRect(x, boxY, orderSizeTextWidth + boxPadding * 2, boxHeight);
  ctx.fillStyle = colors.text;
  ctx.fillText(orderSize, x + boxPadding, y + 1);

  const positionText = `${order.position === "long" ? "Buy" : "Sell"} @ ${order.price}`;
  const positionTextWidth = ctx.measureText(positionText).width;
  x = x - positionTextWidth - boxPadding * 2;
  ctx.fillStyle = colors.background;
  ctx.fillRect(x, boxY, positionTextWidth + boxPadding * 2, boxHeight);
  ctx.strokeRect(x, boxY, positionTextWidth + boxPadding * 2, boxHeight);
  ctx.fillStyle = order.position === "long" ? colors.buyText : colors.sellText;
  ctx.fillText(positionText, x + boxPadding, y + 1);
}

interface DrawTakeProfitOrStopLossBoxParameters {
  ctx: CanvasRenderingContext2D;
  type: "tp" | "sl";
  colors: Colors["orders"];
  y: number;
  price: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
}
function drawTakeProfitOrStopLossBox({
  ctx,
  type,
  colors,
  y,
  price,
  candlesDisplayDimensions,
}: DrawTakeProfitOrStopLossBoxParameters): void {
  ctx.strokeStyle = type === "tp" ? colors.takeProfit : colors.stopLoss;
  const boxY = y - boxHeight / 2;

  const closeOrderText = "X";
  const closeOrderTextWidth = ctx.measureText(closeOrderText).width;
  let x = candlesDisplayDimensions.width - boxMargin - closeOrderTextWidth;
  ctx.fillStyle = colors.text;
  ctx.fillRect(x, boxY, closeOrderTextWidth + boxPadding * 2, boxHeight);
  ctx.strokeRect(x, boxY, closeOrderTextWidth + boxPadding * 2, boxHeight);
  ctx.fillStyle = colors.background;
  ctx.fillText(closeOrderText, x + boxPadding, y + 1);

  let text = type === "sl" ? "Stop Loss" : "Take Profit";
  text = text + " @ " + price;
  const textWidth = ctx.measureText(text).width;
  x = x - textWidth - boxPadding * 2;

  ctx.fillStyle = colors.background;
  ctx.fillRect(x, boxY, textWidth + boxPadding * 2, boxHeight);
  ctx.strokeRect(x, boxY, textWidth + boxPadding * 2, boxHeight);
  ctx.fillStyle = colors.text;
  ctx.fillText(text, x + boxPadding, y + 1);
}
