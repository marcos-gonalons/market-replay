export interface PriceRange {
  min: number;
  max: number;
}

export interface Colors {
  background: string;
  text: string;
  pointerLine: string;
  currentPriceLine: string;
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
}

export interface Coords {
  x: number;
  y: number;
}
