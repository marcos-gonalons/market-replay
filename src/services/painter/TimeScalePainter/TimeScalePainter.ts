/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../../context/dataContext/Types";
import { DEFAULT_FONT, MAX_DATES_IN_DATE_SCALE_PER_1000_PX, TIME_SCALE_HEIGHT_IN_PX } from "../Constants";
import { CandlesDisplayDimensions } from "../Types";
import { getDateFormatted, getDateFormattedShort, prependZero } from "../Utils";

interface DrawTimeScaleParameters {
  ctx: CanvasRenderingContext2D;
  colors: { background: string; border: string };
  candlesDisplayDimensions: CandlesDisplayDimensions;
  dataStartIndex: number;
  dataEndIndex: number;
  maxCandlesAmountInScreen: number;
  dataTemporality: number;
  data: ChartData[];
  canvasWidth: number;
  candleWidth: number;
}

export function drawTimeScale({
  ctx,
  colors,
  candlesDisplayDimensions,
  dataStartIndex,
  dataEndIndex,
  maxCandlesAmountInScreen,
  dataTemporality,
  data,
  canvasWidth,
  candleWidth,
}: DrawTimeScaleParameters): void {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, candlesDisplayDimensions.height, candlesDisplayDimensions.width, TIME_SCALE_HEIGHT_IN_PX);

  ctx.fillStyle = colors.border;
  ctx.fillRect(0, candlesDisplayDimensions.height, canvasWidth, 2);

  ctx.font = "bold 15px Arial";

  let candlesAmountToSkip = Math.ceil(
    maxCandlesAmountInScreen / ((candlesDisplayDimensions.width * MAX_DATES_IN_DATE_SCALE_PER_1000_PX) / 1000)
  );
  if (dataTemporality < 3600) {
    candlesAmountToSkip = Math.ceil(candlesAmountToSkip / 10) * 10;
  }
  let candleNumber = 0;
  for (let i = dataStartIndex; i < dataEndIndex; i++) {
    candleNumber++;
    if (candleNumber % candlesAmountToSkip !== 0) continue;

    const offset = getCandlesOffset(i, dataTemporality, data, dataEndIndex);
    if (!data[i + offset]) break;

    const date = data[i + offset].date;
    const [hours, minutes] = [date.getHours(), date.getMinutes()].map(prependZero);
    /**
     * TODO: If data temporality is bigger than 1 day, display the day instead of hh:mm
     * Or if it's bigger than 1 week or 1 month, display the month
     *
     * Between 1 day and 1 month -> display day
     * Between 1 month and year -> display month
     * Between year and infinite -> display year
     *
     * TODO2: If there is a day change while drawing the time, draw the day instead of the time
     * It should have another style/color to highlight that is a new day
     */
    const text = `${hours}:${minutes}`;
    const textWidth = ctx.measureText(text).width;
    const x = (candleNumber + offset) * candleWidth - candleWidth / 2 - textWidth / 2;
    if (x < candlesDisplayDimensions.width - textWidth - 5) {
      ctx.fillText(text, x, candlesDisplayDimensions.height + 20);
    }
  }

  ctx.font = DEFAULT_FONT;
}

interface DrawDateInPointerPositionParameters {
  ctx: CanvasRenderingContext2D;
  mousePointerX: number;
  candleNumber: number;
  candlesDisplayDimensions: CandlesDisplayDimensions;
  dataArrayOffset: number;
  data: ChartData[];
  highlightColors: { background: string; text: string };
  maxCandlesAmountInScreen: number;
  dataTemporality: number;
  startingIndex: number;
  candleWidth: number;
}

export function drawDateInPointerPosition({
  ctx,
  mousePointerX,
  candleNumber,
  candlesDisplayDimensions,
  dataArrayOffset,
  data,
  highlightColors,
  maxCandlesAmountInScreen,
  dataTemporality,
  startingIndex,
  candleWidth,
}: DrawDateInPointerPositionParameters): void {
  if (mousePointerX > candlesDisplayDimensions.width) return;

  const dataIndex = data.length - maxCandlesAmountInScreen + candleNumber - dataArrayOffset;
  const candle = data[dataIndex];
  let date: Date;

  if (candle) {
    date = candle.date;
  } else {
    let lastCandleNumber = 1;
    let lastCandle: ChartData = data[startingIndex];
    for (let i = startingIndex + 1; i < startingIndex + maxCandlesAmountInScreen; i++) {
      if (!data[i]) break;
      lastCandle = data[i];
      lastCandleNumber++;
    }

    let x = candleWidth * lastCandleNumber;
    let timestampInSeconds = lastCandle.date.valueOf() / 1000;
    while (x < mousePointerX) {
      x = x + candleWidth;
      timestampInSeconds = timestampInSeconds + dataTemporality;
    }

    date = new Date(timestampInSeconds * 1000);
  }

  ctx.font = "bold 15px Arial";

  let text: string;
  if (dataTemporality < 60 * 60 * 24) {
    text = getDateFormatted(date);
  } else {
    text = getDateFormattedShort(date);
  }

  const padding = 5;
  const dateWidthInPx = ctx.measureText(text).width;
  const dateHeightInPx = 30;
  const x = mousePointerX - dateWidthInPx / 2;
  const y = candlesDisplayDimensions.height + 2;

  ctx.fillStyle = highlightColors.background;
  ctx.fillRect(x, y, dateWidthInPx + padding * 2, dateHeightInPx);

  ctx.fillStyle = highlightColors.text;
  ctx.fillText(text, x + padding, y + 16);
  ctx.font = DEFAULT_FONT;
}

function getCandlesOffset(
  currentIndex: number,
  dataTemporality: number,
  data: ChartData[],
  dataEndIndex: number
): number {
  let offset = 0;
  if (dataTemporality < 3600 && data[currentIndex].date.getMinutes() % 10 !== 0) {
    for (let j = currentIndex + 1; j < dataEndIndex; j++) {
      offset++;
      if (data[j].date.getMinutes() % 10 === 0) break;
    }
  }
  return offset;
}
