import { CoinSymbol, Kline, PivotPoints, PatternResult } from '../types';

export const fetchTicker = async (symbol: string) => {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  return res.json();
};

export const fetchKlines = async (symbol: string, interval: string, limit: number): Promise<Kline[]> => {
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  const data = await res.json();
  // Binance kline format: [time, open, high, low, close, volume, ...]
  return data.map((k: any[]) => ({
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
};

export const fetchFundingIndex = async (dapiSymbol: string) => {
  if (!dapiSymbol) return null;
  const res = await fetch(`https://dapi.binance.com/dapi/v1/premiumIndex?symbol=${dapiSymbol}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
};

export const fetchFng = async () => {
  const res = await fetch('https://api.alternative.me/fng/');
  const data = await res.json();
  return data.data[0];
};

// Utility to calculate Pivot Points based on original logic
export const calculatePivots = (klines: Kline[]): PivotPoints => {
  // Logic from original code: check first 3 candles of last 4 days
  let highs: number[] = [];
  let lows: number[] = [];
  
  // Use first 3 candles to find High/Low range
  for(let i=0; i<3; i++) {
      if (klines[i]) {
        highs.push(klines[i].high);
        lows.push(klines[i].low);
      }
  }
  
  const h = Math.max(...highs);
  const l = Math.min(...lows);
  const c = klines[2]?.close || klines[0].close; // Use 3rd candle close based on original code

  const pp = (h + l + c) / 3;
  return {
    pp,
    r1: (2 * pp) - l,
    s1: (2 * pp) - h,
    r2: pp + (h - l),
    s2: pp - (h - l),
    r3: h + 2 * (pp - l),
    s3: l - 2 * (h - pp)
  };
};

export const analyzePattern = (klines: Kline[]): PatternResult => {
    let bullCount = 0;
    let bearCount = 0;
    
    klines.forEach(k => {
        if (k.close >= k.open) bullCount++;
        else bearCount++;
    });

    const total = bullCount + bearCount;
    const bullPct = total > 0 ? Math.round((bullCount / total) * 100) : 0;
    const bearPct = 100 - bullPct;

    const last = klines.length - 1;
    const prev = last - 1;
    
    if (last < 1) return { name: "Analyzing...", trend: 'neutral', bullPct: 50, bearPct: 50 };

    const cNow = klines[last].close;
    const oNow = klines[last].open;
    const hNow = klines[last].high;
    const lNow = klines[last].low;

    const cPrev = klines[prev].close;
    const oPrev = klines[prev].open;

    const bodySize = Math.abs(cNow - oNow);
    const upperWick = hNow - Math.max(oNow, cNow);
    const lowerWick = Math.min(oNow, cNow) - lNow;
    const totalRange = hNow - lNow;

    let patternName = "盤整中";
    let trend: 'bull' | 'bear' | 'neutral' = "neutral";

    if (cPrev < oPrev && cNow > oNow && cNow > oPrev && oNow < cPrev) {
        patternName = "多頭吞噬"; trend = "bull";
    } else if (cPrev > oPrev && cNow < oNow && cNow < oPrev && oNow > cPrev) {
        patternName = "空頭吞噬"; trend = "bear";
    } else if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
        patternName = "錘頭線"; trend = "bull";
    } else if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5) {
        patternName = "流星線"; trend = "bear";
    } else if (bodySize < totalRange * 0.1) {
        patternName = "十字星"; trend = "neutral";
    } else if (cNow > oNow && bodySize > totalRange * 0.8) {
        patternName = "大陽線"; trend = "bull";
    } else if (cNow < oNow && bodySize > totalRange * 0.8) {
        patternName = "大陰線"; trend = "bear";
    }

    return { name: patternName, trend, bullPct, bearPct };
};