import React, { useState } from 'react';
import TopTickerBar from './components/TopTickerBar';
import FundingBar from './components/FundingBar';
import TradingViewWidget from './components/TradingViewWidget';
import AnalysisPanel from './components/AnalysisPanel';
import { CoinSymbol } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [currentCoin, setCurrentCoin] = useState<CoinSymbol>('BTC');
  const [statusColor, setStatusColor] = useState(COLORS.green);

  const coinList: CoinSymbol[] = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'BNB'];
  const metalList: CoinSymbol[] = ['GOLD'];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans text-white bg-black">
      {/* 1. Top Ticker */}
      <TopTickerBar />

      {/* 2. Funding Bar */}
      <FundingBar currentCoin={currentCoin} />

      {/* 3. Header / Nav */}
      <header className="h-12 px-4 bg-[rgba(28,28,30,0.85)] border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar pr-2.5">
            {/* Crypto Group */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-[rgba(255,255,255,0.1)] mr-3">
                <span className="text-[10px] text-[#EBEBF54D] font-semibold whitespace-nowrap">加密貨幣</span>
                <div className="flex bg-[rgba(118,118,128,0.24)] rounded-md p-0.5 h-7 box-border shrink-0">
                    {coinList.map(c => (
                        <button 
                            key={c}
                            onClick={() => setCurrentCoin(c)}
                            className={`px-2.5 rounded text-xs font-medium flex items-center justify-center min-w-[40px] transition-all duration-200 ${currentCoin === c ? 'bg-[rgba(255,255,255,0.15)] font-semibold shadow-sm' : 'text-white hover:bg-white/5'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metal Group */}
            <div className="flex items-center gap-1.5 pr-3">
                <span className="text-[10px] text-[#EBEBF54D] font-semibold whitespace-nowrap">貴金屬</span>
                <div className="flex bg-[rgba(118,118,128,0.24)] rounded-md p-0.5 h-7 box-border shrink-0">
                     {metalList.map(c => (
                        <button 
                            key={c}
                            onClick={() => setCurrentCoin(c)}
                            className={`px-2.5 rounded text-xs font-medium flex items-center justify-center min-w-[40px] transition-all duration-200 ${currentCoin === c ? 'bg-[rgba(255,255,255,0.15)] font-semibold shadow-sm' : 'text-white hover:bg-white/5'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-4">
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }}></div>
             <span className="text-xs text-[#30D158]">連線正常</span>
        </div>
      </header>

      {/* 4. Main Content Grid */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left: Chart (70%) */}
        <div className="flex-[70] relative bg-[#131722] border-r border-[#38383A] min-h-[35vh] md:min-h-auto border-b md:border-b-0">
            <TradingViewWidget currentCoin={currentCoin} />
        </div>

        {/* Right: Analysis (30%) */}
        <div className="flex-[30] min-w-full md:min-w-[320px]">
            <AnalysisPanel currentCoin={currentCoin} />
        </div>
      </div>
    </div>
  );
};

export default App;