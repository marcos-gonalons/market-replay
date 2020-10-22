import { Trade } from "../../../context/tradesContext/Types";
import { DEFAULT_FONT } from "../Constants";
import { getYCoordOfPrice } from "../Utils/Utils";
import { DrawFinishedTradesParameters } from "./Types";

export function drawFinishedTrades({
  ctx,
  trades,
  colors,
  candlesDisplayDimensions,
  priceRange,
  canvasHeight,
  dataStartIndex,
  dataEndIndex,
  candleWidth,
  data,
}: DrawFinishedTradesParameters): void {
  void colors;

  ctx.font = ctx.font = "bold 15px Arial";
  for (const trade of trades) {
    drawTradeStart(trade);
    drawTradeEnd(trade);
  }
  ctx.font = DEFAULT_FONT;

  function drawTradeStart(trade: Trade): void {
    const y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: trade.startPrice });
    if (y <= 0 || y >= canvasHeight) return;

    const x = getDateX(trade.startDate);
    if (x > 0) {
      ctx.fillStyle = trade.result >= 0 ? colors.positive : colors.negative;
      ctx.beginPath();
      ctx.arc(x + candleWidth / 2, y, 10, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function drawTradeEnd(trade: Trade): void {
    const y = getYCoordOfPrice({ candlesDisplayDimensions, priceRange, price: trade.endPrice });
    if (y <= 0 || y >= canvasHeight) return;

    const x = getDateX(trade.endDate);
    if (x > 0) {
      ctx.fillStyle = trade.result >= 0 ? colors.positive : colors.negative;
      ctx.beginPath();
      ctx.arc(x + candleWidth / 2, y, 10, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function getDateX(date: number): number {
    let x: number = -candleWidth;
    for (let i = dataStartIndex; i < dataEndIndex; i++) {
      if (!data[i]) break;

      x += candleWidth;
      if (data[i].timestamp === date) {
        return x;
      }
    }
    return 0;
  }
}
