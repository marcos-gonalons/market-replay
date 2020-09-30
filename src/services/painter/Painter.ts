/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../context/dataContext/Types";
import {
  CANDLES_PER_1000_PX,
  MAX_ZOOM,
  PRICES_PER_1000_PX,
  PRICE_SCALE_WITH_IN_PX,
  ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER,
} from "./Constants";
import { Colors, Coords, PriceRange } from "./Types";

class PainterService {
  private data: ChartData[] = [];
  private canvas: HTMLCanvasElement = null as any;
  private ctx: CanvasRenderingContext2D = null as any;
  private zoomLevel: number = 0;
  private dataArrayOffset: number = 0;
  private candleWidth: number = 0;
  private candlesAmountInScreen: number = 0;
  private priceRangeInScreen: PriceRange = { min: 0, max: 0 };
  private mouseCoords: Coords = { x: 0, y: 0 };
  private isDragging: boolean = false;
  private dragStartMouseCoords: Coords = { x: 0, y: 0 };
  private colors: Colors = {
    background: "rgb(0, 0, 0)",
    text: "rgb(255,255,255)",
    pointerLine: "rgb(255,255,255)",
    priceScale: {
      background: "rgb(0, 0, 0)",
      border: "rgb(255, 255, 255)",
    },
    candle: {
      body: {
        positive: "rgb(7,201,4)",
        negative: "rgb(252,57,35)",
      },
      wick: {
        positive: "rgb(7,201,4)",
        negative: "rgb(252,57,35)",
      },
    },
  };

  public setCanvas(canvas: HTMLCanvasElement): PainterService {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;
    this.ctx.font = "14px Arial";
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
    this.candleWidth = (this.canvas.width - PRICE_SCALE_WITH_IN_PX) / this.candlesAmountInScreen;
    return this;
  }

  public updateCandlesAmountInScreen(): PainterService {
    let candlesInScreen = Math.round((this.canvas.width / 1000) * CANDLES_PER_1000_PX);
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
    this.candlesAmountInScreen = Math.round(candlesInScreen);
    if (this.candlesAmountInScreen >= this.data.length) {
      this.candlesAmountInScreen = this.data.length;
    }
    return this;
  }

  public updateDataArrayOffset(value: number): PainterService {
    if (!this.data || this.data.length === 0) return this;

    this.dataArrayOffset += value;

    if (this.dataArrayOffset < 0) {
      if (Math.abs(this.dataArrayOffset) > this.candlesAmountInScreen) {
        this.dataArrayOffset = -this.candlesAmountInScreen;
      }
    }

    if (this.dataArrayOffset > 0 && this.dataArrayOffset > this.data.length - this.candlesAmountInScreen) {
      this.dataArrayOffset = this.data.length - this.candlesAmountInScreen;
    }

    this.updatePriceRangeInScreen();
    return this;
  }

  public updateZoomLevel(value: number): PainterService {
    const currenCandlesAmountInScreen = this.candlesAmountInScreen;
    this.zoomLevel += value;
    if (Math.abs(this.zoomLevel) > MAX_ZOOM) {
      this.zoomLevel -= value;
    }
    this.updateCandlesAmountInScreen();
    const newCandlesAmountInScreen = this.candlesAmountInScreen;
    if (currenCandlesAmountInScreen === newCandlesAmountInScreen) {
      this.zoomLevel -= value;
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

    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.updateCandlesAmountInScreen();
    this.updateCandleWidth();
    this.updatePriceRangeInScreen();

    this.drawCandles();

    this.drawPriceScale();
    this.drawPointerHorizontalLine();
    this.drawPriceInPointerPosition();
    return this;
  }

  private drawPriceInPointerPosition(): PainterService {
    this.ctx.fillStyle = this.colors.text;

    const price =
      this.priceRangeInScreen.max - this.getPriceRangeInScreenDiff() * (this.mouseCoords.y / this.canvas.height);

    this.ctx.font = "14px Arial";
    this.ctx.fillText(price.toFixed(5), this.canvas.width - PRICE_SCALE_WITH_IN_PX + 6, this.mouseCoords.y);
    return this;
  }

  private drawPriceScale(): PainterService {
    this.ctx.fillStyle = this.colors.priceScale.background;
    this.ctx.fillRect(this.canvas.width - PRICE_SCALE_WITH_IN_PX, 0, PRICE_SCALE_WITH_IN_PX, this.canvas.height);

    this.ctx.fillStyle = this.colors.priceScale.border;
    this.ctx.fillRect(this.canvas.width - PRICE_SCALE_WITH_IN_PX, 0, 2, this.canvas.height);

    const maxRounded = Math.floor(this.priceRangeInScreen.max / 10) * 10;
    const priceJump = Math.ceil(this.getPriceRangeInScreenDiff() / PRICES_PER_1000_PX / 10) * 10 || 10;
    let price = maxRounded;
    while (price > this.priceRangeInScreen.min) {
      const y = (this.canvas.height * (this.priceRangeInScreen.max - price)) / this.getPriceRangeInScreenDiff();
      this.ctx.fillText(price.toString(), this.canvas.width - PRICE_SCALE_WITH_IN_PX + 6, y);
      price = price - priceJump;
    }
    return this;
  }

  private drawPointerHorizontalLine(): PainterService {
    this.ctx.strokeStyle = this.colors.pointerLine;

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.mouseCoords.y + 0.5);
    this.ctx.lineTo(this.canvas.width, this.mouseCoords.y + 0.5);
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

  private getCandleBodyCoordsAndSize(
    candleNumber: number,
    priceForCalculatingY: number,
    priceRangeInScreenDiff: number,
    candleBodyPriceDiff: number
  ): number[] {
    const x = this.candleWidth * candleNumber;
    const y = ((this.priceRangeInScreen.max - priceForCalculatingY) / priceRangeInScreenDiff) * this.canvas.height;
    const w = this.candleWidth;
    const h = (this.canvas.height / priceRangeInScreenDiff) * candleBodyPriceDiff || 1;

    return [x, y, w, h];
  }

  private drawCandleBody(isPositive: boolean, [x, y, w, h]: number[]): PainterService {
    this.ctx.fillStyle = isPositive ? this.colors.candle.body.positive : this.colors.candle.body.negative;
    this.ctx.fillRect(x, y, w, h);
    return this;
  }

  private getDataStartAndEndIndex(): number[] {
    let startingIndex = this.data.length - (this.candlesAmountInScreen + this.dataArrayOffset);
    if (!this.data[startingIndex] && this.dataArrayOffset === 0) {
      startingIndex = 0;
    }
    if (!this.data[startingIndex] && this.dataArrayOffset !== 0) {
      startingIndex = this.data.length - 1;
    }
    let endingIndex = startingIndex + this.candlesAmountInScreen;
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
    this.ctx.lineTo(wickX, candleY - (this.canvas.height / priceRangeDiff) * wickDiff);
    this.ctx.stroke();
    this.ctx.closePath();

    wickDiff = candle.low - (isPositive ? candle.open : candle.close);
    this.ctx.beginPath();
    this.ctx.moveTo(wickX, candleY + candleHeight);
    this.ctx.lineTo(wickX, candleY + candleHeight - (this.canvas.height / priceRangeDiff) * wickDiff);
    this.ctx.stroke();
    this.ctx.closePath();
    return this;
  }

  private getPriceRangeInScreenDiff(): number {
    return this.priceRangeInScreen.max - this.priceRangeInScreen.min;
  }
}

export default PainterService;
