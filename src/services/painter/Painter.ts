/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../context/globalContext/Types";
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
import { drawPointerLines } from "./PointerLinesPainter/PointerLinesPainter";
import {
  drawCurrentPriceInPriceScale,
  drawPriceInPointerPosition,
  drawPriceScale,
} from "./PriceScalePainter/PriceScalePainter";
import { drawDateInPointerPosition, drawTimeScale } from "./TimeScalePainter/TimeScalePainter";
import { CandlesDisplayDimensions, Colors, Coords, PriceRange } from "./Types";

class PainterService {
  private data: ChartData[] = [];
  private dataBackup: ChartData[] = [];
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
  private replayTimer: NodeJS.Timeout | null = null;
  private isReplayPaused: boolean = false;
  private replayTimerTickMilliseconds: number = 10;

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
    this.candleWidth = this.getCandlesDisplayDimensions().width / this.maxCandlesAmountInScreen;
    return this;
  }

  public updateMaxCandlesAmountInScreen(): PainterService {
    let candlesInScreen = Math.round((this.getCandlesDisplayDimensions().width / 1000) * CANDLES_PER_1000_PX);
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
    this.validateOffset().updatePriceRangeInScreen();
    return this;
  }

  public updateOffsetByDate(targetDate: Date): PainterService {
    if (!this.data || this.data.length === 0) return this;

    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].date.valueOf() >= targetDate.valueOf()) {
        this.dataArrayOffset = this.data.length - i - Math.round(this.maxCandlesAmountInScreen / 5);
        break;
      }
    }

    this.validateOffset().updatePriceRangeInScreen();
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

    const [startingIndex, endingIndex] = this.getStartAndEndIndexForCandlesInScreen();
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
    this.drawCurrentPriceInPriceScale();
    this.drawPriceInPointerPosition();

    this.drawTimeScale();
    this.drawDateInPointerPosition();

    this.drawPointerLines();
    this.drawCurrentPriceLine();

    return this;
  }

  public startReplay(): PainterService {
    if (this.replayTimer !== null) return this;

    this.dataBackup = [...this.data];
    this.data = this.data.slice(
      0,
      this.data.length - this.dataArrayOffset - Math.round(this.maxCandlesAmountInScreen / 5)
    );
    this.dataArrayOffset = -Math.round(this.maxCandlesAmountInScreen / 5);
    this.draw();

    this.isReplayPaused = false;
    this.replayTimer = setInterval(() => {
      if (this.isReplayPaused) return;
      this.onReplayTimerTick();
    }, this.replayTimerTickMilliseconds);
    return this;
  }

  public togglePause(): PainterService {
    this.isReplayPaused = !this.isReplayPaused;
    return this;
  }

  public stopReplay(): PainterService {
    clearInterval(this.replayTimer!);
    this.replayTimer = null;

    this.isReplayPaused = false;
    this.data = [...this.dataBackup];
    this.draw();
    return this;
  }

  public goBack(): PainterService {
    if (!this.isReplayPaused) return this;

    this.data.splice(this.data.length - 1, 1);
    this.draw();
    return this;
  }

  public goForward(): PainterService {
    if (!this.isReplayPaused) return this;

    this.onReplayTimerTick();
    return this;
  }

  private drawCandles(): PainterService {
    const [startingIndex, endingIndex] = this.getStartAndEndIndexForCandlesInScreen();
    drawCandles({
      ctx: this.ctx,
      dataStartIndex: startingIndex,
      dataEndIndex: endingIndex,
      data: this.data,
      priceRange: this.priceRangeInScreen,
      candleWidth: this.candleWidth,
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
      colors: this.colors.candle,
    });
    return this;
  }

  private drawPriceScale(): PainterService {
    drawPriceScale({
      ctx: this.ctx,
      canvasHeight: this.canvas.height,
      colors: this.colors.priceScale,
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
      priceRange: this.priceRangeInScreen,
    });
    return this;
  }

  private drawCurrentPriceInPriceScale(): PainterService {
    drawCurrentPriceInPriceScale({
      ctx: this.ctx,
      data: this.data,
      priceRange: this.priceRangeInScreen,
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
      colors: this.colors.currentPrice,
    });
    return this;
  }

  private drawPriceInPointerPosition(): PainterService {
    drawPriceInPointerPosition({
      ctx: this.ctx,
      mousePointerY: this.mouseCoords.y,
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
      priceRange: this.priceRangeInScreen,
      highlightColors: this.colors.highlight,
    });
    return this;
  }

  private drawTimeScale(): PainterService {
    const [startingIndex, endingIndex] = this.getStartAndEndIndexForCandlesInScreen();
    drawTimeScale({
      ctx: this.ctx,
      colors: { ...this.colors.timeScale },
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
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
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
      dataArrayOffset: this.dataArrayOffset,
      data: this.data,
      highlightColors: this.colors.highlight,
      maxCandlesAmountInScreen: this.maxCandlesAmountInScreen,
      dataTemporality: this.dataTemporality,
      startingIndex: this.getStartAndEndIndexForCandlesInScreen()[0],
      candleWidth: this.candleWidth,
    });
    return this;
  }

  private drawPointerLines(): PainterService {
    drawPointerLines({
      ctx: this.ctx,
      color: this.colors.pointerLine,
      mouseCoords: this.mouseCoords,
      candlesDisplayDimensions: this.getCandlesDisplayDimensions(),
    });
    return this;
  }

  private drawCurrentPriceLine(): PainterService {
    let index = this.data.length - this.dataArrayOffset - 1;
    if (index < 0) return this;

    let lastCandleInScreen = this.data[index];
    if (lastCandleInScreen) return this;

    let x = this.getCandlesDisplayDimensions().width;
    while (!lastCandleInScreen) {
      index--;
      x = x - this.candleWidth;
      lastCandleInScreen = this.data[index];
    }

    const y =
      (this.getCandlesDisplayDimensions().height * (this.priceRangeInScreen.max - lastCandleInScreen.close)) /
        (this.priceRangeInScreen.max - this.priceRangeInScreen.min) +
      0.5;

    this.ctx.strokeStyle = this.colors.currentPrice.line;

    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(this.getCandlesDisplayDimensions().width, y);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.setLineDash([]);

    return this;
  }

  private getStartAndEndIndexForCandlesInScreen(): number[] {
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

  private getCandlesDisplayDimensions(): CandlesDisplayDimensions {
    return {
      width: this.canvas.width - PRICE_SCALE_WITH_IN_PX,
      height: this.canvas.height - TIME_SCALE_HEIGHT_IN_PX,
    };
  }

  private validateOffset(): PainterService {
    if (this.dataArrayOffset < 0) {
      if (Math.abs(this.dataArrayOffset) > this.maxCandlesAmountInScreen - 5) {
        this.dataArrayOffset = -this.maxCandlesAmountInScreen + 5;
      }
    }

    if (this.dataArrayOffset > 0 && this.dataArrayOffset > this.data.length - this.maxCandlesAmountInScreen) {
      this.dataArrayOffset = this.data.length - this.maxCandlesAmountInScreen;
    }
    return this;
  }

  private onReplayTimerTick(): void {
    if (this.dataBackup.length > this.data.length) {
      this.data.push(this.dataBackup[this.data.length]);
    } else {
      this.stopReplay();
      return;
    }
    this.draw();
  }
}

export default PainterService;
