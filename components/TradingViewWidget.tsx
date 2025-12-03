import React, { useEffect, useRef } from 'react';
import { COINS } from '../constants';
import { CoinSymbol } from '../types';

interface TradingViewWidgetProps {
  currentCoin: CoinSymbol;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ currentCoin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (window.TradingView && containerRef.current) {
        const isMobile = window.innerWidth <= 768;
        // Clean up previous instance if manageable, usually replacing innerHTML is brute force but works for TV
        containerRef.current.innerHTML = ''; 
        
        new window.TradingView.widget({
            "autosize": true,
            "symbol": COINS[currentCoin].tv,
            "interval": "60",
            "timezone": "Asia/Taipei",
            "theme": "dark",
            "style": "1",
            "locale": "zh_TW",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "withdateranges": true,
            "hide_side_toolbar": isMobile,
            "allow_symbol_change": true,
            "details": false,
            "studies": [
                "RSI@tv-basicstudies",
                "MASimple@tv-basicstudies"
            ],
            "container_id": containerRef.current.id
        });
    }
  }, [currentCoin]);

  return (
    <div className="w-full h-full bg-[#131722]">
        <div id="tradingview_chart" ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default TradingViewWidget;