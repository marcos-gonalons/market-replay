/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../context/dataContext/Types";
import {
  CANDLES_PER_1000_PX,
  MAX_ZOOM,
  PRICE_SCALE_WITH_IN_PX,
  ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER,
  TIME_SCALE_HEIGHT_IN_PX,
  DEFAULT_FONT,
  DEFAULT_COLORS,
} from "./Constants";
import drawPriceScale from "./PriceScalePainter/PriceScalePainter";
import drawTimeScale from "./TimeScalePainter/TimeScalePainter";
import { Colors, Coords, PriceRange } from "./Types";
import { prependZero } from "./Utils";

class PainterService {
  private data: ChartData[] = [];
  private canvas: HTMLCanvasElement = null as any;
  private ctx: CanvasRenderingContext2D = null as any;
  private zoomLevel: number = 0;
  private dataArrayOffset: number = 0;
  private candleWidth: number = 0;
  private maxCandlesAmountInScreen: number = 0;
  private priceRangeInScreen: PriceRange = { min: 0, max: 0 };
  private mouseCoords: Coords = { x: 0, y: 0 };
  private isDragging: boolean = false;
  private dragStartMouseCoords: Coords = { x: 0, y: 0 };
  private dataTemporality: number = 0;
  private colors: Colors = DEFAULT_COLORS;

  public setCanvas(canvas: HTMLCanvasElement): PainterService {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;
    return this;
  }

  public setIsDragging(v: boolean): PainterService {
    this.isDragging = v;
    if (this.isDragging) {
      this.dragStartMouseCoords = { ...this.mouseCoords };
    }
    return this;
  }

  public setData(data: ChartData[]): PainterService {
    this.data = data;
    this.setDataTemporality();
    return this;
  }

  public resetDataArrayOffset(): PainterService {
    this.dataArrayOffset = 0;
    return this;
  }

  public updateMouseCoords(coords: Coords): PainterService {
    this.mouseCoords = coords;

    if (this.isDragging) {
      this.updateDataArrayOffset(-(this.dragStartMouseCoords.x - this.mouseCoords.x));
      this.draw();

      this.dragStartMouseCoords = { ...this.mouseCoords };
    }
    return this;
  }

  public updateCandleWidth(): PainterService {
    this.candleWidth = this.getWidthForCandlesDisplay() / this.maxCandlesAmountInScreen;
    return this;
  }

  public updateMaxCandlesAmountInScreen(): PainterService {
    let candlesInScreen = Math.round((this.getWidthForCandlesDisplay() / 1000) * CANDLES_PER_1000_PX);
    let i = this.zoomLevel;
    if (i < 0) {
      while (i < 0) {
        candlesInScreen = candlesInScreen + candlesInScreen * ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER;
        i++;
      }
    }
    if (i >= 0) {
      while (i > 0) {
        candlesInScreen = candlesInScreen - candlesInScreen * ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER;
        i--;
      }
    }
    this.maxCandlesAmountInScreen = Math.round(candlesInScreen);
    if (this.maxCandlesAmountInScreen >= this.data.length) {
      this.maxCandlesAmountInScreen = this.data.length;
    }
    return this;
  }

  public updateDataArrayOffset(value: number): PainterService {
    if (!this.data || this.data.length === 0) return this;

    this.dataArrayOffset += value;

    if (this.dataArrayOffset < 0) {
      if (Math.abs(this.dataArrayOffset) > this.maxCandlesAmountInScreen - 5) {
        this.dataArrayOffset = -this.maxCandlesAmountInScreen + 5;
      }
    }

    if (this.dataArrayOffset > 0 && this.dataArrayOffset > this.data.length - this.maxCandlesAmountInScreen) {
      this.dataArrayOffset = this.data.length - this.maxCandlesAmountInScreen;
    }

    this.updatePriceRangeInScreen();
    return this;
  }

  public updateZoomLevel(value: number): PainterService {
    const currenMaxCandlesAmountInScreen = this.maxCandlesAmountInScreen;
    this.zoomLevel += value;
    if (Math.abs(this.zoomLevel) > MAX_ZOOM) {
      this.zoomLevel -= value;
      this.updateMaxCandlesAmountInScreen();
    } else {
      this.updateMaxCandlesAmountInScreen();
      const newCandlesAmountInScreen = this.maxCandlesAmountInScreen;
      if (currenMaxCandlesAmountInScreen === newCandlesAmountInScreen) {
        this.zoomLevel -= value;
      }
    }

    this.updateDataArrayOffset(0);
    return this;
  }

  public updatePriceRangeInScreen(): PainterService {
    if (this.data.length === 0) return this;

    const [startingIndex, endingIndex] = this.getDataStartAndEndIndex();
    let min = this.data[startingIndex].low;
    let max = this.data[startingIndex].high;
    for (let i = startingIndex + 1; i < endingIndex; i++) {
      if (this.data[i].low < min) {
        min = this.data[i].low;
      }
      if (this.data[i].high > max) {
        max = this.data[i].high;
      }
    }
    this.priceRangeInScreen = { max, min };
    return this;
  }

  public draw(): PainterService {
    if (!this.data || this.data.length === 0) {
      return this;
    }

    this.ctx.font = DEFAULT_FONT;
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.updateMaxCandlesAmountInScreen();
    this.updateCandleWidth();
    this.updatePriceRangeInScreen();

    this.drawCandles();

    this.drawPriceScale();
    this.drawPriceInPointerPosition();

    this.drawTimeScale();
    this.drawDateInPointerPosition();

    this.drawPointerLines();
    this.drawCurrentPriceLine();
    return this;
  }

  private drawPriceInPointerPosition(): PainterService {
    if (this.mouseCoords.y > this.getHeightForCandlesDisplay()) {
      return this;
    }

    const price =
      this.priceRangeInScreen.max -
      this.getPriceRangeInScreenDiff() * (this.mouseCoords.y / this.getHeightForCandlesDisplay());

    this.ctx.fillStyle = this.colors.highlight.background;
    this.ctx.fillRect(this.getWidthForCandlesDisplay(), this.mouseCoords.y - 12.5, PRICE_SCALE_WITH_IN_PX, 25);

    this.ctx.font = "bold 15px Arial";
    this.ctx.fillStyle = this.colors.highlight.text;
    this.ctx.fillText(price.toFixed(5), this.getWidthForCandlesDisplay() + 15, this.mouseCoords.y + 1);
    this.ctx.font = DEFAULT_FONT;
    return this;
  }

  private drawDateInPointerPosition(): PainterService {
    if (this.mouseCoords.x > this.getWidthForCandlesDisplay()) return this;

    const candleNumber = Math.floor(this.mouseCoords.x / this.candleWidth);
    const dataIndex = this.data.length - this.maxCandlesAmountInScreen + candleNumber - this.dataArrayOffset;
    const candle = this.data[dataIndex];

    if (!candle) return this;

    const dateWidthInPx = 170;
    const dateHeightInPx = 30;
    const x = this.mouseCoords.x - dateWidthInPx / 2;
    const y = this.getHeightForCandlesDisplay() + 2;

    this.ctx.fillStyle = this.colors.highlight.background;
    this.ctx.fillRect(x, y, dateWidthInPx, dateHeightInPx);

    this.ctx.font = "bold 15px Arial";
    this.ctx.fillStyle = this.colors.highlight.text;
    this.ctx.fillText(this.getDateFormatted(candle.date), x + 5, y + 16);
    this.ctx.font = DEFAULT_FONT;
    return this;
  }

  private drawPointerLines(): PainterService {
    this.ctx.setLineDash([10, 5]);
    if (this.mouseCoords.y < this.getHeightForCandlesDisplay()) {
      this.drawPointerHorizontalLine();
    }
    if (this.mouseCoords.x < this.getWidthForCandlesDisplay()) {
      this.drawPointerVerticalLine();
    }
    this.ctx.setLineDash([]);
    return this;
  }

  private drawCurrentPriceLine(): PainterService {
    let index = this.data.length - this.dataArrayOffset - 1;
    if (index < 0) return this;

    let lastCandleInScreen = this.data[index];
    if (lastCandleInScreen) return this;

    let x = this.getWidthForCandlesDisplay();
    while (!lastCandleInScreen) {
      index--;
      x = x - this.candleWidth;
      lastCandleInScreen = this.data[index];
    }

    const y =
      (this.getHeightForCandlesDisplay() * (this.priceRangeInScreen.max - lastCandleInScreen.close)) /
        this.getPriceRangeInScreenDiff() +
      0.5;

    this.ctx.strokeStyle = this.colors.currentPriceLine;

    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(this.getWidthForCandlesDisplay(), y);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.setLineDash([]);

    return this;
  }

  private drawPointerHorizontalLine(): PainterService {
    this.ctx.strokeStyle = this.colors.pointerLine;

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.mouseCoords.y + 0.5);
    this.ctx.lineTo(this.getWidthForCandlesDisplay(), this.mouseCoords.y + 0.5);
    this.ctx.stroke();
    this.ctx.closePath();

    return this;
  }

  private drawPointerVerticalLine(): PainterService {
    this.ctx.strokeStyle = this.colors.pointerLine;

    this.ctx.beginPath();
    this.ctx.moveTo(this.mouseCoords.x + 0.5, 0);
    this.ctx.lineTo(this.mouseCoords.x + 0.5, this.getHeightForCandlesDisplay());
    this.ctx.stroke();
    this.ctx.closePath();

    return this;
  }

  private drawCandles(): PainterService {
    const [startingIndex, endingIndex] = this.getDataStartAndEndIndex();
    let candleNumber = 0;
    const priceRangeInScreenDiff = this.getPriceRangeInScreenDiff() || 100;
    for (let i = startingIndex; i < endingIndex; i++) {
      const candle = this.data[i];
      const isPositive = candle.close >= candle.open;

      const [x, y, w, h] = this.getCandleBodyCoordsAndSize(
        candleNumber,
        isPositive ? candle.close : candle.open,
        priceRangeInScreenDiff,
        Math.abs(candle.open - candle.close)
      );

      this.drawCandleBody(isPositive, [x, y, w, h]);
      this.drawCandleWicks(isPositive, candle, priceRangeInScreenDiff, x, y, h);

      candleNumber++;
    }
    return this;
  }

  private drawPriceScale(): PainterService {
    drawPriceScale({
      ctx: this.ctx,
      canvasHeight: this.canvas.height,
      colors: { ...this.colors.priceScale },
      candlesDisplayDimensions: {
        width: this.getWidthForCandlesDisplay(),
        height: this.getHeightForCandlesDisplay(),
      },
      priceRange: this.priceRangeInScreen,
    });
    return this;
  }

  private drawTimeScale(): PainterService {
    const [startingIndex, endingIndex] = this.getDataStartAndEndIndex();
    drawTimeScale({
      ctx: this.ctx,
      colors: { ...this.colors.timeScale },
      candlesDisplayDimensions: {
        width: this.getWidthForCandlesDisplay(),
        height: this.getHeightForCandlesDisplay(),
      },
      candlesInScreenStartIndex: startingIndex,
      candlesInScreenEndIndex: endingIndex,
      maxCandlesAmountInScreen: this.maxCandlesAmountInScreen,
      dataTemporality: this.dataTemporality,
      data: this.data,
      canvasWidth: this.canvas.width,
      candleWidth: this.candleWidth,
    });
    return this;
  }

  private getCandleBodyCoordsAndSize(
    candleNumber: number,
    priceForCalculatingY: number,
    priceRangeInScreenDiff: number,
    candleBodyPriceDiff: number
  ): number[] {
    const x = this.candleWidth * candleNumber;
    const y =
      ((this.priceRangeInScreen.max - priceForCalculatingY) / priceRangeInScreenDiff) *
      this.getHeightForCandlesDisplay();
    const w = this.candleWidth;
    const h = (this.getHeightForCandlesDisplay() / priceRangeInScreenDiff) * candleBodyPriceDiff || 1;

    return [x, y, w, h];
  }

  private drawCandleBody(isPositive: boolean, [x, y, w, h]: number[]): PainterService {
    this.ctx.fillStyle = isPositive ? this.colors.candle.body.positive : this.colors.candle.body.negative;
    this.ctx.fillRect(x, y, w, h);
    return this;
  }

  private getDataStartAndEndIndex(): number[] {
    let startingIndex = this.data.length - (this.maxCandlesAmountInScreen + this.dataArrayOffset);
    if (!this.data[startingIndex] && this.dataArrayOffset === 0) {
      startingIndex = 0;
    }
    if (!this.data[startingIndex] && this.dataArrayOffset !== 0) {
      startingIndex = this.data.length - 1;
    }
    let endingIndex = startingIndex + this.maxCandlesAmountInScreen;
    if (endingIndex > this.data.length) {
      endingIndex = this.data.length;
    }

    return [startingIndex, endingIndex];
  }

  private drawCandleWicks(
    isPositive: boolean,
    candle: ChartData,
    priceRangeDiff: number,
    candleX: number,
    candleY: number,
    candleHeight: number
  ): PainterService {
    this.ctx.strokeStyle = isPositive ? this.colors.candle.wick.positive : this.colors.candle.wick.negative;

    let wickDiff = candle.high - (isPositive ? candle.close : candle.open);
    const wickX = candleX + this.candleWidth / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(wickX, candleY);
    this.ctx.lineTo(wickX, candleY - (this.getHeightForCandlesDisplay() / priceRangeDiff) * wickDiff);
    this.ctx.stroke();
    this.ctx.closePath();

    wickDiff = candle.low - (isPositive ? candle.open : candle.close);
    this.ctx.beginPath();
    this.ctx.moveTo(wickX, candleY + candleHeight);
    this.ctx.lineTo(wickX, candleY + candleHeight - (this.getHeightForCandlesDisplay() / priceRangeDiff) * wickDiff);
    this.ctx.stroke();
    this.ctx.closePath();
    return this;
  }

  private getPriceRangeInScreenDiff(): number {
    return this.priceRangeInScreen.max - this.priceRangeInScreen.min;
  }

  private getHeightForCandlesDisplay(): number {
    return this.canvas.height - TIME_SCALE_HEIGHT_IN_PX;
  }

  private getWidthForCandlesDisplay(): number {
    return this.canvas.width - PRICE_SCALE_WITH_IN_PX;
  }

  private getDateFormatted(d: Date): string {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dic"];

    const [day, month, year, hours, minutes, seconds] = [
      d.getDate(),
      months[d.getMonth()],
      d.getFullYear(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ].map(prependZero);

    return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
  }

  private setDataTemporality(): PainterService {
    const diffs: { diff: number; amount: number }[] = [];
    for (let i = 0; i <= 200; i++) {
      if (!this.data[i] || !this.data[i + 1]) break;

      const diffInMilliseconds = this.data[i + 1].date.valueOf() - this.data[i].date.valueOf();
      const diff = diffs.find((d) => d.diff === diffInMilliseconds);
      if (diff) {
        diff.amount++;
      } else {
        diffs.push({ diff: diffInMilliseconds, amount: 1 });
      }
    }

    let maxOccurrences = 0;
    let dataTemporality: number = 0;
    for (const d of diffs) {
      if (d.amount >= maxOccurrences) {
        dataTemporality = d.diff;
        maxOccurrences = d.amount;
      }
    }

    this.dataTemporality = dataTemporality / 1000;
    return this;
  }
}

export default PainterService;
