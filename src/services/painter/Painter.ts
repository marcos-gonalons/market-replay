/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChartData } from "../../context/dataContext/Types";
import {
  CANDLES_PER_1000_PX,
  MAX_ZOOM,
  MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX,
  PRICE_SCALE_WITH_IN_PX,
  ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER,
  TIME_SCALE_HEIGHT_IN_PX,
  DEFAULT_FONT,
  MAX_DATES_IN_DATE_SCALE_PER_1000_PX,
} from "./Constants";
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
  private colors: Colors = {
    background: "rgb(0, 0, 0)",
    text: "rgb(255,255,255)",
    pointerLine: "rgb(200,200,200)",
    currentPriceLine: "rgb(250,174,132)",
    highlight: {
      background: "rgb(100,100,100)",
      text: "rgb(255,255,255)",
    },
    priceScale: {
      background: "rgb(0, 0, 0)",
      border: "rgb(255, 255, 255)",
    },
    timeScale: {
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
    this.updateDataTemporality();
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
    this.ctx.fillText(price.toFixed(4), this.getWidthForCandlesDisplay() + 15, this.mouseCoords.y + 1);
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

  private drawPriceScale(): PainterService {
    this.ctx.fillStyle = this.colors.priceScale.background;
    this.ctx.fillRect(this.getWidthForCandlesDisplay(), 0, PRICE_SCALE_WITH_IN_PX, this.getHeightForCandlesDisplay());

    this.ctx.fillStyle = this.colors.priceScale.border;
    this.ctx.fillRect(this.getWidthForCandlesDisplay(), 0, 2, this.canvas.height);

    let maxPrice: number;
    let priceJump: number;
    if (this.getPriceRangeInScreenDiff() > 2) {
      maxPrice = Math.floor(this.priceRangeInScreen.max / 10) * 10;
      priceJump =
        Math.ceil(
          this.getPriceRangeInScreenDiff() / ((this.canvas.height * MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX) / 1000) / 10
        ) * 10 || 1;
    } else {
      maxPrice = this.priceRangeInScreen.max;
      priceJump = parseFloat(
        (
          this.getPriceRangeInScreenDiff() /
          ((this.canvas.height * MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX) / 1000)
        ).toFixed(5)
      );
    }

    let price = maxPrice;
    while (price > this.priceRangeInScreen.min) {
      const y =
        (this.getHeightForCandlesDisplay() * (this.priceRangeInScreen.max - price)) / this.getPriceRangeInScreenDiff();

      if (y > 20 && y < this.getHeightForCandlesDisplay() - 20) {
        this.ctx.fillRect(this.getWidthForCandlesDisplay(), y, 10, 1);
        this.ctx.fillText(parseFloat(price.toFixed(5)).toString(), this.getWidthForCandlesDisplay() + 15, y);
      }

      price = price - priceJump;
    }
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

  private drawTimeScale(): PainterService {
    this.ctx.fillStyle = this.colors.timeScale.background;
    this.ctx.fillRect(0, this.getHeightForCandlesDisplay(), this.getWidthForCandlesDisplay(), TIME_SCALE_HEIGHT_IN_PX);

    this.ctx.fillStyle = this.colors.timeScale.border;
    this.ctx.fillRect(0, this.getHeightForCandlesDisplay(), this.canvas.width, 2);

    this.ctx.font = "bold 15px Arial";

    const [startingIndex, endingIndex] = this.getDataStartAndEndIndex();
    let skip = Math.ceil(
      this.maxCandlesAmountInScreen / ((this.getWidthForCandlesDisplay() * MAX_DATES_IN_DATE_SCALE_PER_1000_PX) / 1000)
    );
    if (this.dataTemporality < 3600) {
      skip = Math.ceil(skip / 10) * 10;
    }
    let candleNumber = 1;
    for (let i = startingIndex; i < endingIndex; i++) {
      if (candleNumber % skip === 0) {
        let date = this.data[i].date;

        let offset = 0;
        if (this.dataTemporality < 3600) {
          if (date.getMinutes() % 10 !== 0) {
            for (let j = i + 1; j < endingIndex; j++) {
              offset++;
              if (this.data[j].date.getMinutes() % 10 === 0) break;
            }
          }
        }
        if (offset > 0) {
          date = this.data[i + offset].date;
        }

        const [hours, minutes] = [date.getHours(), date.getMinutes()].map(this.prependZero);
        /**
         * TODO: If data temporality is bigger than 1 day, display the day instead of hh:mm
         * Or if it's bigger than 1 week or 1 month, display the month
         * Make use of the method getDataTemporalityInSeconds !!! :) :)
         *
         * TODO2: If there is a day change while drawing the time, draw the day instead of the time
         * It should have another style/color to highlight that is a new day
         *
         * TODO3: Refactor this a lil bit
         *
         * TODO3: Beware that  this.data[i + offset] may be null
         */
        const text = `${hours}:${minutes}`;
        const textWidth = this.ctx.measureText(text).width;
        const x = (candleNumber + offset) * this.candleWidth - this.candleWidth / 2 - textWidth / 2;
        if (x < this.getWidthForCandlesDisplay() - textWidth - 5) {
          this.ctx.fillText(text, x, this.getHeightForCandlesDisplay() + 20);
        }
      }
      candleNumber++;
    }

    this.ctx.font = DEFAULT_FONT;
    return this;
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
    ].map(this.prependZero);

    return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
  }

  private updateDataTemporality(): PainterService {
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

  private prependZero(el: number | string): number | string {
    return el.toString().length === 1 ? `0${el}` : el;
  }
}

export default PainterService;
