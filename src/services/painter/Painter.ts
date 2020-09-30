/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../context/dataContext/Types";

const PRICE_SCALE_WITH_IN_PX = 100;
const PRICE_SCALE_BACKGOUND_COLOR = "rgb(0, 200, 0)";
const CANDLES_PER_1000_PX = 120;
const ZOOM_LEVEL_CANDLES_MODIFIER = 0.1;

type PriceRange = {
  min: number;
  max: number;
};

class PainterService {
  private data: ChartData[] = [];
  private canvas: HTMLCanvasElement = null as any;
  private ctx: CanvasRenderingContext2D = null as any;
  private zoomLevel: number = 1;
  private dataArrayOffset: number = 0;
  private candleWidth: number = 0;
  private candlesAmountInScreen: number = 0;
  private priceRangeInScreen: PriceRange = { min: 0, max: 0 };

  public setCanvas(canvas: HTMLCanvasElement): PainterService {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;
    return this;
  }

  public setData(data: ChartData[]): PainterService {
    this.data = data;
    return this;
  }

  public updateCandleWidth(): PainterService {
    this.candleWidth = (this.canvas.width - PRICE_SCALE_WITH_IN_PX) / this.candlesAmountInScreen;
    return this;
  }

  public updateCandlesAmountInScreen(): PainterService {
    let candlesInScreen = Math.round((this.canvas.width / 1000) * CANDLES_PER_1000_PX);
    let i = this.zoomLevel;
    while (i > 1) {
      candlesInScreen = candlesInScreen - candlesInScreen * ZOOM_LEVEL_CANDLES_MODIFIER;
      i--;
    }
    this.candlesAmountInScreen = Math.round(candlesInScreen);
    return this;
  }

  public updateDataArrayOffset(value: number): PainterService {
    this.dataArrayOffset += value;
    this.updatePriceRangeInScreen();
    return this;
  }

  public updatePriceRangeInScreen(): PainterService {
    if (this.data.length === 0) return this;

    const startingIndex = this.data.length - (this.candlesAmountInScreen + this.dataArrayOffset);
    let min = this.data[startingIndex].low;
    let max = this.data[startingIndex].high;
    for (let i = startingIndex + 1; i < startingIndex + this.candlesAmountInScreen; i++) {
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
    this.drawPriceScale();
    this.drawCandles();
    return this;
  }

  private drawPriceScale(): PainterService {
    this.ctx.fillStyle = PRICE_SCALE_BACKGOUND_COLOR;
    this.ctx.fillRect(this.canvas.width - PRICE_SCALE_WITH_IN_PX, 0, PRICE_SCALE_WITH_IN_PX, this.canvas.height);
    return this;
  }

  private drawCandles(): PainterService {
    this.ctx.fillStyle = "rgb(200, 0, 0)";
    const startingIndex = this.data.length - (this.candlesAmountInScreen + this.dataArrayOffset);
    let candleNumber = 0;
    const priceRangeDiff = this.priceRangeInScreen.max - this.priceRangeInScreen.min;
    for (let i = startingIndex; i < startingIndex + this.candlesAmountInScreen; i++) {
      const candle = this.data[i];
      const candlePriceDiff = candle.high - candle.low;
      const y = ((this.priceRangeInScreen.max - candle.high) / priceRangeDiff) * this.canvas.height;
      const height = (this.canvas.height / priceRangeDiff) * candlePriceDiff;

      this.ctx.fillRect(this.candleWidth * candleNumber, y, this.candleWidth, height);

      candleNumber++;
    }
    return this;
  }
}

export default PainterService;
