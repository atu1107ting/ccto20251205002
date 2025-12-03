import React, { useEffect, useState, useRef } from 'react';
import { COLORS } from '../constants';

interface TickerState {
  val: string;
  pct: string;
  pctVal: number;
}

const TopTickerBar: React.FC = () => {
  const [btc, setBtc] = useState<TickerState>({ val: '--', pct: '--%', pctVal: 0 });
  const [eth, setEth] = useState<TickerState>({ val: '--', pct: '--%', pctVal: 0 });
  const [sol, setSol] = useState<TickerState>({ val: '--', pct: '--%', pctVal: 0 });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
        wsRef.current = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker");
        
        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const data = message.data;
            const stream = message.stream;
            
            const price = parseFloat(data.c);
            const pct = parseFloat(data.P);
            
            const displayPrice = "$" + Math.floor(price).toLocaleString();
            const displayPct = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
            const newState = { val: displayPrice, pct: displayPct, pctVal: pct };

            if (stream === 'btcusdt@ticker') setBtc(newState);
            else if (stream === 'ethusdt@ticker') setEth(newState);
            else if (stream === 'solusdt@ticker') setSol(newState);
        };
    };

    connect();

    return () => {
        if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const TickerItem = ({ name, data }: { name: string, data: TickerState }) => (
    <div className="flex items-center gap-1.5">
      <span className="font-bold text-[#EBEBF599]">{name}</span>
      <span className="font-mono text-white">{data.val}</span>
      <span className={`text-[11px] ${data.pctVal >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
        {data.pct}
      </span>
    </div>
  );

  return (
    <div className="h-8 bg-[#121214] border-b border-[#2c2c2e] flex items-center pt-[calc(env(safe-area-inset-top)+2px)] px-4 overflow-x-auto whitespace-nowrap gap-5 shrink-0 text-[11px] no-scrollbar justify-center">
      <TickerItem name="BTC" data={btc} />
      <TickerItem name="ETH" data={eth} />
      <TickerItem name="SOL" data={sol} />
    </div>
  );
};

export default TopTickerBar;