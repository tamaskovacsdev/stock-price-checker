export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubSymbol {
  currency: string;
  description: string;
  displaySymbol: string;
  figi: string;
  mic: string;
  symbol: string;
  type: string;
}

export interface FinnhubError {
  error: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  volume?: number;
  timestamp: Date;
  change?: number;
  percentChange?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}
