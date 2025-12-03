import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CoinSymbol, TickerData, PivotPoints, PatternResult } from '../types';
import { fetchTicker, fetchKlines, calculatePivots, analyzePattern } from '../services/api';
import { COLORS, COINS } from '../constants';

interface AnalysisPanelProps {
  currentCoin: CoinSymbol;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ currentCoin }) => {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [tickerWsData, setTickerWsData] = useState<{price: number, change: number} | null>(null);
  const [momentums, setMomentums] = useState({ m1: 0, m5: 0, m15: 0, h1: 0 });
  const [pivots, setPivots] = useState<PivotPoints | null>(null);
  const [pivotTime, setPivotTime] = useState<string>('--:--');
  const [aiAnalysis, setAiAnalysis] = useState<{ badge: string, color: string, text: string, time: string }>({
      badge: 'LOADING', color: '#555', text: '正在分析市場結構...', time: '--:--'
  });
  const [patterns, setPatterns] = useState<Record<string, PatternResult>>({});
  const [patternTime, setPatternTime] = useState<string>('--:--');
  const [timers, setTimers] = useState<Record<string, string>>({});
  
  const wsRef = useRef<WebSocket | null>(null);
  const prevPriceRef = useRef<number>(0);

  const getTimeStr = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  };

  // Helper to fetch change
  const fetchChange = useCallback(async (interval: string) => {
    const klines = await fetchKlines(COINS[currentCoin].binance, interval, 1);
    if (klines.length > 0) {
        const k = klines[0];
        return ((k.close - k.open) / k.open) * 100;
    }
    return 0;
  }, [currentCoin]);

  const refreshPivots = useCallback(async () => {
    const symbol = COINS[currentCoin].binance;
    try {
        const dailyKlines = await fetchKlines(symbol, '1d', 4);
        const calc = calculatePivots(dailyKlines);
        setPivots(calc);
        setPivotTime(getTimeStr());
    } catch (e) { console.error(e); }
  }, [currentCoin]);

  const refreshPatterns = useCallback(async () => {
      const symbol = COINS[currentCoin].binance;
      try {
        const timeframes = ['5m', '15m', '1h', '4h', '1d'];
        const limits = { '5m': 864, '15m': 288, '1h': 72, '4h': 18, '1d': 3 };
        const newPatterns: Record<string, PatternResult> = {};
        
        await Promise.all(timeframes.map(async tf => {
            const klines = await fetchKlines(symbol, tf, (limits as any)[tf]);
            newPatterns[tf] = analyzePattern(klines);
        }));
        
        setPatterns(newPatterns);
        setPatternTime(getTimeStr());
      } catch (e) { console.error(e); }
  }, [currentCoin]);

  const refreshAI = useCallback(async () => {
     setAiAnalysis(prev => ({ ...prev, badge: 'UPDATING...' }));
     const symbol = COINS[currentCoin].binance;
     try {
        const [tickerData, dailyKlines] = await Promise.all([
            fetchTicker(symbol),
            fetchKlines(symbol, '1d', 4)
        ]);

        const nowPrice = parseFloat(tickerData.lastPrice);
        
        let sum = 0;
        for(let i=0; i<3; i++) sum += dailyKlines[i].close;
        const sma3 = sum / 3;
        const diff = (nowPrice - sma3) / sma3;
        let trend = "neutral";
        if (diff > 0.003) trend = "bull";
        else if (diff < -0.003) trend = "bear";

        const { r1, r2, r3, s1, s2, s3, pp } = calculatePivots(dailyKlines);
        
        let badge = "觀察中";
        let badgeColor = COLORS.textSecondary;
        let analysisText = "";
        const dec = currentCoin === 'BTC' ? 0 : 2;

        if (nowPrice > r3) {
            analysisText = `價格強勢突破 R3，多頭情緒極度高昂，注意超買回調風險。`;
            badge = "極度強勢"; badgeColor = COLORS.green;
        } else if (nowPrice > r2) {
            analysisText = `價格突破 R2，上漲動能強勁，目標看向 R3。`;
            badge = "強勢突破"; badgeColor = COLORS.green;
        } else if (nowPrice > r1) {
            analysisText = `價格突破 R1 (${r1.toFixed(dec)})，動能轉強，留意 R2 壓力。`;
            badge = "轉強"; badgeColor = COLORS.green;
        } else if (nowPrice < s3) {
            analysisText = `價格跌破 S3，空頭情緒極度恐慌，可能出現超賣反彈或持續崩盤。`;
            badge = "極度弱勢"; badgeColor = COLORS.red;
        } else if (nowPrice < s2) {
            analysisText = `價格跌破 S2，空頭動能強勁，下看 S3 支撐。`;
            badge = "弱勢探底"; badgeColor = COLORS.red;
        } else if (nowPrice < s1) {
            analysisText = `跌破 S1 (${s1.toFixed(dec)})，轉為弱勢，關注 S2 支撐防守情況。`;
            badge = "轉弱"; badgeColor = COLORS.red;
        } else if (nowPrice > pp) {
            analysisText = `位於分界 ${pp.toFixed(dec)} 之上，偏多震盪。回調不破分界可視為買點。`;
            badge = "偏多震盪"; badgeColor = COLORS.blue;
        } else {
            analysisText = `位於分界 ${pp.toFixed(dec)} 之下，短期承壓。反彈若不過分界，趨勢偏空。`;
            badge = "偏空震盪"; badgeColor = COLORS.orange;
        }

        analysisText += trend === 'bull' ? ' 3日均線向上，建議逢低做多。' : (trend === 'bear' ? ' 3日均線向下，建議逢高做空。' : ' 3日趨勢不明，建議保持觀望。');
        
        setAiAnalysis({ badge, color: badgeColor, text: analysisText, time: getTimeStr() });

     } catch (e) { console.error(e); }
  }, [currentCoin]);

  // Main Data Loop
  useEffect(() => {
    const loadData = async () => {
        const symbol = COINS[currentCoin].binance;
        
        fetchTicker(symbol).then(setTicker);
        Promise.all([fetchChange('1m'), fetchChange('5m'), fetchChange('15m'), fetchChange('1h')])
            .then(([m1, m5, m15, h1]) => setMomentums({ m1, m5, m15, h1 }));

        refreshPivots();
        refreshPatterns();
        refreshAI();
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Reload every min

    return () => clearInterval(interval);
  }, [currentCoin, fetchChange, refreshPivots, refreshPatterns, refreshAI]);

  // WebSocket for real-time price
  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    wsRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${COINS[currentCoin].ws}@ticker`);
    wsRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const price = parseFloat(data.c);
        const change = parseFloat(data.P);
        setTickerWsData({ price, change });
    };
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [currentCoin]);

  // Timer Tick
  useEffect(() => {
      const tick = () => {
          const now = Date.now();
          const format = (ms: number) => {
            const totalSec = Math.floor(ms / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` : `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
          };
          
          setTimers({
              '5m': format(5 * 60 * 1000 - (now % (5 * 60 * 1000))),
              '15m': format(15 * 60 * 1000 - (now % (15 * 60 * 1000))),
              '1h': format(60 * 60 * 1000 - (now % (60 * 60 * 1000))),
              '4h': format(4 * 60 * 60 * 1000 - (now % (4 * 60 * 60 * 1000))),
              '1d': format(24 * 60 * 60 * 1000 - (now % (24 * 60 * 60 * 1000))),
          });
      };
      const i = setInterval(tick, 1000);
      return () => clearInterval(i);
  }, []);

  const formatPrice = (p: number) => {
    if (currentCoin === 'BTC' || currentCoin === 'ETH' || currentCoin === 'GOLD') return p.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (p < 10) return p.toFixed(4);
    if (p < 1000) return p.toFixed(2);
    return Math.floor(p).toLocaleString();
  };

  const displayPrice = tickerWsData ? formatPrice(tickerWsData.price) : '--.--';
  const displayChange = tickerWsData ? tickerWsData.change : 0;
  const priceColor = tickerWsData && tickerWsData.price > prevPriceRef.current ? COLORS.green : (tickerWsData && tickerWsData.price < prevPriceRef.current ? COLORS.red : 'white');
  if (tickerWsData) prevPriceRef.current = tickerWsData.price;

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto pb-20 min-w-[320px] border-l border-[#38383A]">
        {/* Header */}
        <div className="p-4 flex justify-between items-center shrink-0">
            <div className="text-base font-bold text-white">盤面解析</div>
            <div className="text-xs text-[#EBEBF599] font-semibold">{currentCoin} / USDT</div>
        </div>

        {/* Card 1: Overview */}
        <div className="mx-3 mt-1.5 p-3.5 rounded-xl flex flex-col gap-1.5 bg-[#1C1C1E]">
            <div className="text-xs text-[#EBEBF599] uppercase font-semibold tracking-wide border-b border-[rgba(255,255,255,0.05)] pb-1 mb-[-4px]">即時行情</div>
            <div className="flex justify-between items-baseline mt-2">
                <div className="flex flex-col gap-0.5">
                    <div className={`text-[22px] font-bold tracking-tight transition-colors duration-300 font-sans`} style={{ color: priceColor }}>{displayPrice}</div>
                    <div className={`text-sm font-semibold px-2 py-0.5 rounded-xl text-center min-w-[50px] ${displayChange >= 0 ? 'bg-[rgba(48,209,88,0.15)] text-[#30D158]' : 'bg-[rgba(255,69,58,0.15)] text-[#FF453A]'}`}>
                        {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <StatRow label="24H 高" val={ticker ? parseFloat(ticker.highPrice).toLocaleString() : '--'} />
                    <StatRow label="24H 低" val={ticker ? parseFloat(ticker.lowPrice).toLocaleString() : '--'} />
                    <StatRow label="24H 量(U)" val={ticker ? (parseFloat(ticker.quoteVolume) > 1000000000 ? (parseFloat(ticker.quoteVolume)/1000000000).toFixed(2)+'B' : (parseFloat(ticker.quoteVolume)/1000000).toFixed(2)+'M') : '--'} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                <MomentumItem label="1分鐘漲跌" val={momentums.m1} />
                <MomentumItem label="5分鐘漲跌" val={momentums.m5} />
                <MomentumItem label="15分鐘漲跌" val={momentums.m15} />
                <MomentumItem label="1小時漲跌" val={momentums.h1} />
            </div>
        </div>

        {/* Card 2: AI Strategy */}
        <div className="mx-3 mt-1.5 p-3.5 rounded-xl flex flex-col gap-1.5 bg-[#1C1C1E]">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-1 mb-[-4px]">
                <div className="text-xs text-[#EBEBF599] uppercase font-semibold tracking-wide">AI 主策略</div>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-[#EBEBF54D] font-mono">更新於 {aiAnalysis.time}</div>
                    <button onClick={refreshAI} className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(10,132,255,0.2)] flex items-center justify-center text-[#0A84FF] transition-all active:rotate-180" title="手動刷新">
                        ↻
                    </button>
                </div>
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3 flex flex-col gap-0.5 mt-2">
                <div className="text-[32px] font-extrabold tracking-wide leading-[1.1]" style={{ color: aiAnalysis.color, textShadow: `0 0 10px ${aiAnalysis.color}40` }}>{aiAnalysis.badge}</div>
                <div className="text-[15px] leading-relaxed text-[#EBEBF599] mt-1">{aiAnalysis.text}</div>
            </div>
        </div>

        {/* Card 3: Pivots */}
        <div className="mx-3 mt-1.5 p-3.5 rounded-xl flex flex-col gap-1.5 bg-[#1C1C1E]">
             <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-1 mb-[-4px]">
                <div className="text-xs text-[#EBEBF599] uppercase font-semibold tracking-wide">關鍵點位</div>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-[#EBEBF54D] font-mono">更新於 {pivotTime}</div>
                    <button onClick={refreshPivots} className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(10,132,255,0.2)] flex items-center justify-center text-[#0A84FF] transition-all active:rotate-180" title="手動刷新">
                        ↻
                    </button>
                </div>
             </div>
             <div className="grid grid-cols-1 gap-[1px] bg-[rgba(84,84,88,0.3)] rounded-lg overflow-hidden mt-2">
                {pivots && (
                    <>
                    <PivotRow label="壓力位 R3" val={pivots.r3} color={COLORS.red} />
                    <PivotRow label="壓力位 R2" val={pivots.r2} color={COLORS.red} />
                    <PivotRow label="壓力位 R1" val={pivots.r1} color={COLORS.red} />
                    <PivotRow label="多空分界" val={pivots.pp} color={COLORS.orange} />
                    <PivotRow label="支撐位 S1" val={pivots.s1} color={COLORS.green} />
                    <PivotRow label="支撐位 S2" val={pivots.s2} color={COLORS.green} />
                    <PivotRow label="支撐位 S3" val={pivots.s3} color={COLORS.green} />
                    </>
                )}
             </div>
        </div>

        {/* Card 4: Patterns */}
        <div className="mx-3 mt-1.5 p-3.5 rounded-xl flex flex-col gap-1.5 bg-[#1C1C1E]">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-1 mb-[-4px]">
                <div className="text-xs text-[#EBEBF599] uppercase font-semibold tracking-wide">全時區型態偵測</div>
                <div className="flex items-center gap-2">
                    <div className="text-[10px] text-[#EBEBF54D] font-mono">更新於 {patternTime}</div>
                    <button onClick={refreshPatterns} className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(10,132,255,0.2)] flex items-center justify-center text-[#0A84FF] transition-all active:rotate-180" title="手動刷新">
                        ↻
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-1 bg-[rgba(255,255,255,0.05)] rounded-lg p-2 mt-2">
                <div className="grid grid-cols-[70px_1.5fr_1fr] pb-1 mb-1 border-b border-[rgba(255,255,255,0.1)] text-xs text-[#EBEBF54D] font-semibold">
                    <span>時區</span>
                    <span className="text-center">3日多空比例</span>
                    <span className="text-right">型態分析</span>
                </div>
                {(['5m', '15m', '1h', '4h', '1d'] as const).map(tf => (
                    <PatternRow key={tf} tf={tf} timer={timers[tf]} data={patterns[tf]} />
                ))}
            </div>
        </div>

        <div className="text-center text-[10px] text-[#FF9F0A] p-5 opacity-80 font-medium mt-auto">
             ⚠️ 若數據顯示異常或延遲，請嘗試手動重新整理網頁 (F5)
        </div>
        <div className="text-center text-[9px] text-[#EBEBF54D] pb-3 font-mono">
             Ver. 3.4 - React Port | Data: Binance
        </div>
    </div>
  );
};

const StatRow = ({label, val}: {label: string, val: string}) => (
    <div className="flex gap-1.5 items-baseline">
        <span className="text-[10px] text-[#EBEBF54D] uppercase font-medium">{label}</span>
        <span className="text-xs font-semibold font-mono text-[#EBEBF599]">{val}</span>
    </div>
);

const MomentumItem = ({label, val}: {label: string, val: number}) => (
    <div className="flex flex-col gap-[1px]">
        <span className="text-[11px] text-[#EBEBF54D] uppercase font-semibold">{label}</span>
        <span className={`text-base font-extrabold font-mono ${val >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
            {val >= 0 ? '+' : ''}{val.toFixed(2)}%
        </span>
    </div>
);

const PivotRow = ({label, val, color}: {label: string, val: number, color: string}) => (
    <div className="flex justify-between items-center bg-[#2C2C2E] py-1.5 px-3">
        <span className="text-[15px] font-semibold text-white">{label}</span>
        <span className="text-[16px] font-extrabold font-mono tracking-wide" style={{ color }}>{val < 10 ? val.toFixed(4) : (val < 1000 ? val.toFixed(2) : Math.floor(val).toLocaleString())}</span>
    </div>
);

const PatternRow = ({tf, timer, data}: {tf: string, timer: string, data?: PatternResult}) => {
    if (!data) return null;
    return (
        <div className="grid grid-cols-[70px_1.5fr_1fr] items-center pb-1.5 border-b border-[rgba(255,255,255,0.1)] gap-2.5 last:border-0 last:pb-0">
            <div className="flex flex-col items-start gap-[1px]">
                <span className="text-[13px] font-bold text-white bg-[rgba(255,255,255,0.15)] px-1.5 rounded text-center min-w-[36px]">{tf}</span>
                <span className="text-[10px] text-[#EBEBF54D] font-mono">{timer || '--:--'}</span>
            </div>
            <div className="flex flex-col gap-[1px] w-full">
                <div className="flex justify-between text-xs font-semibold text-[#EBEBF599]">
                    <span className="text-[#30D158]">多</span>
                    <span>{data.bullPct}%</span>
                    <span className="text-[#FF453A]">空</span>
                </div>
                <div className="w-full h-[3px] bg-[rgba(255,255,255,0.1)] rounded overflow-hidden flex">
                    <div className="h-full bg-[#30D158] transition-all duration-500" style={{ width: `${data.bullPct}%` }} />
                    <div className="h-full bg-[#FF453A] transition-all duration-500" style={{ width: `${data.bearPct}%` }} />
                </div>
            </div>
            <div className="flex flex-row items-center justify-end gap-2 text-right whitespace-nowrap">
                <span className={`text-[15px] font-bold ${
                    data.trend === 'bull' ? 'text-[#30D158]' : (data.trend === 'bear' ? 'text-[#FF453A]' : 'text-[#EBEBF599]')
                }`} style={{
                    textShadow: data.trend === 'bull' ? '0 0 10px rgba(48, 209, 88, 0.4)' : (data.trend === 'bear' ? '0 0 10px rgba(255, 69, 58, 0.4)' : 'none')
                }}>
                    {data.name}
                </span>
            </div>
        </div>
    );
};

export default AnalysisPanel;