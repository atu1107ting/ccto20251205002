import React, { useEffect, useState } from 'react';
import { fetchFng, fetchFundingIndex } from '../services/api';
import { COINS } from '../constants';
import { CoinSymbol, FngData } from '../types';

interface FundingBarProps {
  currentCoin: CoinSymbol;
}

const FundingBar: React.FC<FundingBarProps> = ({ currentCoin }) => {
  const [fng, setFng] = useState<FngData | null>(null);
  const [fundingRate, setFundingRate] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('--:--:--');

  useEffect(() => {
    // Fetch Fear & Greed
    fetchFng().then(setFng).catch(console.error);

    // Fetch Funding Rate
    const dapi = COINS[currentCoin].dapi;
    if (dapi) {
        fetchFundingIndex(dapi).then((data) => {
            if (data) {
                setFundingRate(parseFloat(data.lastFundingRate));
                const nextTime = parseInt(data.nextFundingTime);
                startTimer(nextTime);
            }
        }).catch(console.error);
    } else {
        setFundingRate(null);
        setCountdown('--:--:--');
    }

    // Interval for F&G doesn't need to be frequent, but Funding does.
    const interval = setInterval(() => {
        if (dapi) {
            fetchFundingIndex(dapi).then(data => {
                if (data) {
                    setFundingRate(parseFloat(data.lastFundingRate));
                    const nextTime = parseInt(data.nextFundingTime);
                    startTimer(nextTime);
                }
            });
        }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentCoin]);

  const startTimer = (endTime: number) => {
     // Simple immediate update loop is handled by a separate useEffect or just interval ref?
     // We'll rely on a global 1s ticker for countdown in a real app, but here local is fine.
     // To avoid interval mess, we just store endTime and calculate in a separate effect
     sessionStorage.setItem('fundingEndTime', endTime.toString());
  };

  useEffect(() => {
    const timer = setInterval(() => {
        const endTimeStr = sessionStorage.getItem('fundingEndTime');
        if (!endTimeStr) return;
        const endTime = parseInt(endTimeStr);
        const now = Date.now();
        const diff = endTime - now;
        
        if (diff <= 0) {
            setCountdown("00:00:00");
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getFngColor = (val: number) => {
    if (val >= 75) return { bg: '#30D158', text: '#000' }; // Extreme Greed
    if (val >= 55) return { bg: 'rgba(48, 209, 88, 0.6)', text: '#fff' }; // Greed
    if (val >= 45) return { bg: '#EBEBF54D', text: '#fff' }; // Neutral
    if (val >= 25) return { bg: 'rgba(255, 69, 58, 0.6)', text: '#fff' }; // Fear
    return { bg: '#FF453A', text: '#000' }; // Extreme Fear
  };

  const fngVal = fng ? parseInt(fng.value) : 0;
  const fngStyles = getFngColor(fngVal);
  const fngDate = fng ? new Date(parseInt(fng.timestamp) * 1000) : new Date();
  const fngDateStr = `${fngDate.getMonth() + 1}/${fngDate.getDate()}`;

  const frPercent = fundingRate !== null ? (fundingRate * 100).toFixed(4) + '%' : 'N/A';
  const frColor = fundingRate && fundingRate > 0 ? 'text-[#30D158]' : (fundingRate && fundingRate < 0 ? 'text-[#FF453A]' : 'text-white');

  return (
    <div className="h-9 bg-[#161618] border-b border-[#38383A] flex items-center justify-between px-4 text-xs shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[#EBEBF599] font-semibold">情緒</span>
        <span 
            className="px-1.5 py-[1px] rounded-[3px] font-extrabold text-[10px]"
            style={{ backgroundColor: fngStyles.bg, color: fngStyles.text }}
        >
            {fng ? `${fngVal} ${fng.value_classification.split(' ')[1] || fng.value_classification}` : '--'}
        </span>
        <span className="text-[10px] text-[#EBEBF54D] font-mono">更新於 {fngDateStr}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#EBEBF599] font-semibold">費率</span>
            <span className={`font-mono font-bold text-[13px] ${frColor}`}>{frPercent}</span>
        </div>
        <div className="font-mono text-[11px] text-[#FF9F0A] bg-[rgba(255,159,10,0.15)] px-1.5 py-[1px] rounded-[3px]">
            {countdown}
        </div>
      </div>
    </div>
  );
};

export default FundingBar;