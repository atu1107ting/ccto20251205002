export type CoinSymbol = 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'DOGE' | 'ADA' | 'GOLD' | 'BNB';

export interface CoinConfig {
  tv: string;
  binance: string;
  ws: string;
  dapi: string | null;
}

export interface TickerData {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

export interface FundingData {
  lastFundingRate: string;
  nextFundingTime: number;
}

export interface FngData {
  value: string;
  value_classification: string;
  timestamp: string;
}

export interface Kline {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PivotPoints {
  r3: number;
  r2: number;
  r1: number;
  pp: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface PatternResult {
  name: string;
  trend: 'bull' | 'bear' | 'neutral';
  bullPct: number;
  bearPct: number;
}