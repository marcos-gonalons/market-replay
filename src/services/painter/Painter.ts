/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../context/dataContext/Types";
import { drawCandles } from "./CandlesPainter/CandlesPainter";
import {
  CANDLES_PER_1000_PX,
  MAX_ZOOM,
  PRICE_SCALE_WITH_IN_PX,
  ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER,
  TIME_SCALE_HEIGHT_IN_PX,
  DEFAULT_FONT,
  DEFAULT_COLORS,
} from "./Constants";
import { drawPriceInPointerPosition, drawPriceScale } from "./PriceScalePainter/PriceScalePainter";
import { drawDateInPointerPosition, drawTimeScale } from "./TimeScalePainter/TimeScalePainter";
import { Colors, Coords, PriceRange } from "./Types";

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

  private drawCandles(): PainterService {
    const [startingIndex, endingIndex] = this.getDataStartAndEndIndex();
    drawCandles({
      ctx: this.ctx,
      dataStartIndex: startingIndex,
      dataEndIndex: endingIndex,
      data: this.data,
      priceRange: this.priceRangeInScreen,
      candleWidth: this.candleWidth,
      candlesDisplayDimensions: {
        width: this.getWidthForCandlesDisplay(),
        height: this.getHeightForCandlesDisplay(),
      },
      colors: this.colors.candle,
    });
    return this;
  }

  private drawPriceScale(): PainterService {
    drawPriceScale({
      ctx: this.ctx,
      canvasHeight: this.canvas.height,
      colors: this.colors.priceScale,
      candlesDisplayDimensions: {
        width: this.getWidthForCandlesDisplay(),
        height: this.getHeightForCandlesDisplay(),
      },
      priceRange: this.priceRangeInScreen,
    });
    return this;
  }

  private drawPriceInPointerPosition(): PainterService {
    drawPriceInPointerPosition({
      ctx: this.ctx,
      mousePointerY: this.mouseCoords.y,
      candlesDisplayDimensions: {
        width: this.getWidthForCandlesDisplay(),
        height: this.getHeightForCandlesDisplay(),
      },
      priceRange: this.priceRangeInScreen,
      highlightColors: this.colors.highlight,
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
      dataStartIndex: startingIndex,
      dataEndIndex: endingIndex,
      maxCandlesAmountInScreen: this.maxCandlesAmountInScreen,
      dataTemporality: this.dataTemporality,
      data: this.data,
      canvasWidth: this.canvas.width,
      candleWidth: this.candleWidth,
    });
    return this;
  }

  private drawDateInPointerPosition(): PainterService {
    drawDateInPointerPosition({
      ctx: this.ctx,
      mousePointerX: this.mouseCoords.x,
      candleNumber: Math.floor(this.mouseCoords.x / this.candleWidth),
      candlesDisplayDimensions: {
        width: this.getWidthForCandlesDisplay(),
        height: this.getHeightForCandlesDisplay(),
      },
      dataArrayOffset: this.dataArrayOffset,
      data: this.data,
      highlightColors: this.colors.highlight,
      maxCandlesAmountInScreen: this.maxCandlesAmountInScreen,
    });
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

  private getPriceRangeInScreenDiff(): number {
    return this.priceRangeInScreen.max - this.priceRangeInScreen.min;
  }

  private getHeightForCandlesDisplay(): number {
    return this.canvas.height - TIME_SCALE_HEIGHT_IN_PX;
  }

  private getWidthForCandlesDisplay(): number {
    return this.canvas.width - PRICE_SCALE_WITH_IN_PX;
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
