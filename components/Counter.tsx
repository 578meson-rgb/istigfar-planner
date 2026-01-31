
import React, { useState, useEffect } from 'react';

interface CounterProps {
  initialCount: number;
  onCountChange: (newCount: number) => void;
}

const Counter: React.FC<CounterProps> = ({ initialCount, onCountChange }) => {
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const handleIncrement = () => {
    const next = count + 1;
    setCount(next);
    onCountChange(next);
    setPulse(true);
    setTimeout(() => setPulse(false), 100);
    if ('vibrate' in navigator) navigator.vibrate(25);
  };

  return (
    <div className="flex flex-col items-center space-y-20 py-16">
      <div 
        onClick={handleIncrement}
        className={`
          relative w-80 h-80 rounded-full flex items-center justify-center 
          cursor-pointer select-none transition-all duration-200 active:scale-90
          shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.1)]
          ${pulse ? 'bg-emerald-500 shadow-emerald-500/50 scale-105' : 'bg-[#0a0f0d]'}
          group
        `}
      >
        {/* Outer Halo Rings */}
        <div className="absolute inset-[-20px] rounded-full border border-emerald-500/10 scale-110 opacity-30"></div>
        <div className="absolute inset-[-40px] rounded-full border border-emerald-500/5 scale-120 opacity-20"></div>

        {/* Gloss Layer */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
        
        {/* Center Display */}
        <div className="text-center relative z-20 pointer-events-none">
          <span className="block text-emerald-100/20 text-[9px] font-black tracking-[0.8em] uppercase mb-4">RECITE</span>
          <span className={`text-9xl font-black tabular-nums cinzel transition-colors duration-300 ${pulse ? 'text-white' : 'text-emerald-50'}`}>
            {count}
          </span>
        </div>

        {/* Dynamic Inner Glow */}
        <div className={`absolute inset-0 rounded-full bg-emerald-500 blur-3xl transition-opacity duration-300 pointer-events-none ${pulse ? 'opacity-40' : 'opacity-0'}`}></div>
      </div>

      <div className="flex space-x-20 items-center opacity-20 group">
        <button 
          onClick={(e) => { e.stopPropagation(); if(confirm("Reset progress?")) { setCount(0); onCountChange(0); }}}
          className="text-[10px] font-black uppercase tracking-[0.4em] hover:opacity-100 hover:text-red-500 transition-all hover:scale-110"
        >
          Reset
        </button>
        <div className="w-2 h-2 rounded-full bg-emerald-500/40"></div>
        <button 
          onClick={(e) => { e.stopPropagation(); const v = prompt("Adjust count:", count.toString()); if(v) { setCount(parseInt(v)); onCountChange(parseInt(v)); }}}
          className="text-[10px] font-black uppercase tracking-[0.4em] hover:opacity-100 hover:text-emerald-500 transition-all hover:scale-110"
        >
          Adjust
        </button>
      </div>
      
      <p className="text-[10px] font-black uppercase tracking-[0.8em] opacity-10 animate-pulse text-glow">Surrender to the Flow</p>
    </div>
  );
};

export default Counter;
