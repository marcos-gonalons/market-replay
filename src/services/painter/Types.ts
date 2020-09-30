export interface PriceRange {
  min: number;
  max: number;
}

export interface Colors {
  background: string;
  priceScale: string;
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
