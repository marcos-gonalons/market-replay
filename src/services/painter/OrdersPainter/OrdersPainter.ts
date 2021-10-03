import { Order } from "../../../context/tradesContext/Types";
import { DEFAULT_FONT } from "../Constants";
import { getYCoordOfPrice } from "../Utils/Utils";
import { DrawOrdersParameters } from "./Types";

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
    if (order.createdAt! > currentCandle.timestamp) continue;

      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: order.price });
      drawOrderLine(y, order.type !== "market" ? colors.limit : colors.market);
      drawOrderData(y, order);

    if (order.stopLoss) {
      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: order.stopLoss });
      drawOrderLine(y, colors.stopLoss);
      drawTakeProfitOrStopLossBox(order.stopLoss, "sl");
    }
    if (order.takeProfit) {
      y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: order.takeProfit });
      drawOrderLine(y, colors.takeProfit);
      drawTakeProfitOrStopLossBox(order.takeProfit, "tp");
    }
  }
  ctx.font = DEFAULT_FONT;

  function drawOrderLine(y: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.setLineDash([5, 2]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(candlesDisplayDimensions.width, y);
    ctx.stroke();
    ctx.closePath();
    ctx.setLineDash([]);
  }

  function drawOrderData(y: number, order: Order): void {
    ctx.strokeStyle = order.type !== "market" ? colors.limit : colors.market;
    const boxY = y - boxHeight / 2;

    const closeOrderText = "X";
    const closeOrderTextWidth = ctx.measureText(closeOrderText).width;
    const orderSize = order.size.toString();

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

  function drawTakeProfitOrStopLossBox(price: number, type: "tp" | "sl"): void {
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
}
