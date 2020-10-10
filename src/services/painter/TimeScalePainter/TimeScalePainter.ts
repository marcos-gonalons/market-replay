/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../../context/globalContext/Types";
import {
  DEFAULT_FONT,
  MAX_DATES_IN_DATE_SCALE_PER_1000_PX,
  SECONDS_IN_A_DAY,
  SECONDS_IN_A_MONTH,
  SECONDS_IN_A_YEAR,
  TIME_SCALE_HEIGHT_IN_PX,
} from "../Constants";
import { CandlesDisplayDimensions, Colors } from "../Types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dic"];

interface DrawTimeScaleParameters {
  ctx: CanvasRenderingContext2D;
  colors: Colors["timeScale"];
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
    const text = getTextForTimeScaleDates(date, dataTemporality);
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

  const text = getTextForDateInPointerPosition(dataTemporality, date);

  const dateWidthInPx = ctx.measureText(text).width;
  const dateHeightInPx = 30;
  const x = mousePointerX - dateWidthInPx / 2;
  const y = candlesDisplayDimensions.height + 2;
  const paddingInPx = 5;

  ctx.fillStyle = highlightColors.background;
  ctx.fillRect(x, y, dateWidthInPx + paddingInPx * 2, dateHeightInPx);

  ctx.fillStyle = highlightColors.text;
  ctx.fillText(text, x + paddingInPx, y + 16);
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

function getTextForTimeScaleDates(date: Date, dataTemporality: number): string {
  const [hours, minutes] = [date.getHours(), date.getMinutes()].map(prependZero);

  let text: string;
  if (dataTemporality < SECONDS_IN_A_DAY) {
    text = `${hours}:${minutes}`;
  } else if (dataTemporality < SECONDS_IN_A_MONTH) {
    text = `${getMonthAsString(date)} ${date.getDate().toString()}`;
  } else if (dataTemporality < SECONDS_IN_A_YEAR) {
    text = `${getMonthAsString(date)} ${date.getFullYear()}`;
  } else {
    text = date.getFullYear().toString();
  }

  return text;
}

function getTextForDateInPointerPosition(dataTemporality: number, date: Date): string {
  let text: string;

  if (dataTemporality < SECONDS_IN_A_DAY) {
    const [day, month, year, hours, minutes, seconds] = [
      date.getDate(),
      getMonthAsString(date),
      date.getFullYear(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ].map(prependZero);

    text = `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
  } else if (dataTemporality < SECONDS_IN_A_MONTH) {
    const [day, month, year] = [date.getDate(), getMonthAsString(date), date.getFullYear()];
    text = `${day} ${month} ${year}`;
  } else if (dataTemporality < SECONDS_IN_A_YEAR) {
    const [month, year] = [getMonthAsString(date), date.getFullYear()];
    text = `${month} ${year}`;
  } else {
    text = date.getFullYear().toString();
  }

  return text;
}

function prependZero(el: number | string): number | string {
  return el.toString().length === 1 ? `0${el}` : el;
}

function getMonthAsString(d: Date): string {
  return MONTHS[d.getMonth()];
}
