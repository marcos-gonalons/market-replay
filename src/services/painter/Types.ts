export interface Range {
  min: number;
  max: number;
}

export interface Colors {
  background: string;
  text: string;
  pointerLine: string;
  currentPrice: {
    line: string;
    background: string;
    text: string;
  };
  highlight: {
    background: string;
    text: string;
  };
  priceScale: {
    background: string;
    border: string;
  };
  timeScale: {
    background: string;
    border: string;
  };
  candle: {
    body: {
      positive: string;
      negative: string;
    };
    wick: {
      positive: string;
      negative: string;
    };
  };
  orders: {
    market: string;
    limit: string;
    takeProfit: string;
    stopLoss: string;
    text: string;
    background: string;
    buyText: string;
    sellText: string;
  };
  trades: {
    positive: string;
    negative: string;
  };
  volume: {
    positive: string;
    negative: string;
  };
  indicators: {
    movingAverages: {
      [key: string]: { [key: string]: string }
    }
  }
}

export interface Coords {
  x: number;
  y: number;
}

export interface CandlesDisplayDimensions {
  width: number;
  height: number;
}
