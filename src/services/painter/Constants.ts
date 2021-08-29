import { Colors } from "./Types";

export const PRICE_SCALE_WITH_IN_PX = 100;
export const TIME_SCALE_HEIGHT_IN_PX = 50;
export const CANDLES_PER_1000_PX = 150;
export const ZOOM_LEVEL_CANDLES_AMOUNT_MODIFIER = 0.1;
export const MAX_ZOOM = 15;
export const MAX_PRICES_IN_PRICE_SCALE_PER_1000_PX = 20;
export const MAX_DATES_IN_DATE_SCALE_PER_1000_PX = 10;
export const DEFAULT_FONT = "14px Arial";
export const VOLUME_HEIGHT_IN_PERCENTAGE = 0.2;
export const CANDLES_DISPLAY_PADDING_IN_PERCENTAGE = 0.075;

export const SECONDS_IN_AN_HOUR = 3600;
export const SECONDS_IN_A_DAY = SECONDS_IN_AN_HOUR * 24;
export const SECONDS_IN_A_WEEK = SECONDS_IN_A_DAY * 7;
export const SECONDS_IN_A_MONTH = SECONDS_IN_A_DAY * (365 / 12);
export const SECONDS_IN_A_YEAR = SECONDS_IN_A_MONTH * 12;

export const SPREAD = 0; // 0.000025; // 0.00001
export const STOP_LOSS_POINTS_HANDICAP = 0.00025; // 0.00025 // 2
export const STOP_ORDER_POINTS_HANDICAP = 0; // 1.66

/***
 * jpy 0.0077
 * usd 0.85
 * cad 0.67
 * chf 0.93
 */
export const EUR_EXCHANGE_RATE = 0.93;

export const DEFAULT_COLORS: Colors = {
  background: "rgb(0, 0, 0)",
  text: "rgb(255,255,255)",
  pointerLine: "rgb(200,200,200)",
  currentPrice: {
    line: "rgb(250,174,132)",
    text: "rgb(0,0,0)",
    background: "rgb(255,255,255)",
  },
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
      positive: "rgb(0,201,10)",
      negative: "rgb(201,10,0)",
    },
    wick: {
      positive: "rgb(0,201,10)",
      negative: "rgb(201,10,0)",
    },
  },
  orders: {
    market: "rgb(3,167,255)",
    limit: "rgb(92,92,92)",
    takeProfit: "rgb(2,138,0)",
    stopLoss: "rgb(138,0,46)",
    text: "rgb(0,0,0)",
    background: "rgb(255,255,255)",
    buyText: "rgb(26,156,0)",
    sellText: "rgb(156,3,0)",
  },
  trades: {
    positive: "rgba(65,242,77,.8)",
    negative: "rgba(242,77,65,.8)",
  },
  volume: {
    positive: "rgba(0,201,10,.25)",
    negative: "rgba(201,10,0,.25)",
  },
};
