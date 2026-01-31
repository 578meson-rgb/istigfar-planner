
import React, { useState } from 'react';

interface CounterProps {
  count: number;
  onCountChange: (newCount: number) => void;
  labels: {
    recite: string;
    reset: string;
    adjust: string;
  };
}

const Counter: React.FC<CounterProps> = ({ count, onCountChange, labels }) => {
  const [pulse, setPulse] = useState(false);

  const handleIncrement = () => {
    onCountChange(count + 1);
    setPulse(true);
    setTimeout(() => setPulse(false), 120);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Using a more non-blocking approach if needed, but confirm is standard
    if (window.confirm(labels.reset + "?")) {
      onCountChange(0);
    }
  };

  const handleAdjust = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = window.prompt(labels.adjust + ":", count.toString());
    if (v !== null) {
      const n = parseInt(v);
      if (!isNaN(n) && n >= 0) {
        onCountChange(n);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-12">
      <div 
        onClick={handleIncrement}
        className={`
          relative w-64 h-64 rounded-full flex items-center justify-center 
          cursor-pointer select-none transition-all duration-150 active:scale-90
          shadow-[0_45px_100px_-25px_rgba(1,22,30,0.25),inset_0_-8px_20px_rgba(0,0,0,0.15),inset_0_4px_10px_rgba(255,255,255,0.2)]
          ${pulse ? 'bg-gradient-to-tr from-[#064e3b] to-[#10b981] scale-105' : 'bg-gradient-to-tr from-[#065f46] to-[#059669]'}
          group
        `}
      >
        {/* Shine Overlay */}
        <div className="absolute top-4 left-1/4 w-1/2 h-1/4 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-lg"></div>
        
        {/* Number Display */}
        <div className="text-center relative z-20 pointer-events-none">
          <span className={`block text-[11px] font-black font-outfit tracking-[0.4em] uppercase mb-4 transition-opacity ${pulse ? 'opacity-50' : 'opacity-30'} text-white`}>
            {labels.recite}
          </span>
          <span className={`text-8xl font-black tabular-nums font-outfit tracking-tighter transition-colors duration-300 text-white`}>
            {count}
          </span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex space-x-12 items-center opacity-40 hover:opacity-100 transition-all duration-500">
        <button 
          onClick={handleReset}
          className="text-[11px] font-black uppercase tracking-widest font-outfit hover:text-red-600 text-[#01161e] transition-colors"
        >
          {labels.reset}
        </button>
        <div className="w-1.5 h-1.5 rounded-full bg-[#124559] opacity-30"></div>
        <button 
          onClick={handleAdjust}
          className="text-[11px] font-black uppercase tracking-widest font-outfit hover:text-[#059669] text-[#01161e] transition-colors"
        >
          {labels.adjust}
        </button>
      </div>
    </div>
  );
};

export default Counter;
