import { CoinConfig, CoinSymbol } from './types';

export const COINS: Record<CoinSymbol, CoinConfig> = {
  'BTC': { tv: 'BINANCE:BTCUSDT', binance: 'BTCUSDT', ws: 'btcusdt', dapi: 'BTCUSD_PERP' },
  'ETH': { tv: 'BINANCE:ETHUSDT', binance: 'ETHUSDT', ws: 'ethusdt', dapi: 'ETHUSD_PERP' },
  'SOL': { tv: 'BINANCE:SOLUSDT', binance: 'SOLUSDT', ws: 'solusdt', dapi: 'SOLUSD_PERP' },
  'XRP': { tv: 'BINANCE:XRPUSDT', binance: 'XRPUSDT', ws: 'xrpusdt', dapi: 'XRPUSD_PERP' },
  'DOGE': { tv: 'BINANCE:DOGEUSDT', binance: 'DOGEUSDT', ws: 'dogeusdt', dapi: 'DOGEUSD_PERP' },
  'ADA': { tv: 'BINANCE:ADAUSDT', binance: 'ADAUSDT', ws: 'adausdt', dapi: 'ADAUSD_PERP' },
  'GOLD': { tv: 'BINANCE:PAXGUSDT', binance: 'PAXGUSDT', ws: 'paxgusdt', dapi: null },
  'BNB': { tv: 'BINANCE:BNBUSDT', binance: 'BNBUSDT', ws: 'bnbusdt', dapi: 'BNBUSD_PERP' }
};

export const COLORS = {
  bg: '#000000',
  card: '#1C1C1E',
  nav: 'rgba(28, 28, 30, 0.85)',
  border: '#38383A',
  blue: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  textSecondary: '#EBEBF599',
  textTertiary: '#EBEBF54D',
};