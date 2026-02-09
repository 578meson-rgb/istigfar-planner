import React, { useState, useEffect } from 'react';

interface CounterProps {
  count: number; // This is the daily total from App state
  onCountChange: (newCount: number) => void;
  labels: {
    recite: string;
    reset: string;
    adjust: string;
  };
}

const Counter: React.FC<CounterProps> = ({ count, onCountChange, labels }) => {
  const [sessionCount, setSessionCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  // If the total count is externally reset to zero, reset session too.
  useEffect(() => {
    if (count === 0) setSessionCount(0);
  }, [count]);

  const handleIncrement = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Update local session
    setSessionCount(prev => prev + 1);
    
    // Update global daily total
    onCountChange(count + 1);
    
    setPulse(true);
    setTimeout(() => setPulse(false), 120);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessionCount > 0 && count > 0) {
      setSessionCount(prev => prev - 1);
      onCountChange(count - 1);
      if ('vibrate' in navigator) navigator.vibrate(5);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only reset the visual session counter, NOT the daily total data
    setSessionCount(0);
    if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
  };

  const handleAdjust = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = window.prompt(labels.adjust + " (Daily Total):", count.toString());
    if (v !== null) {
      const n = parseInt(v);
      if (!isNaN(n) && n >= 0) {
        onCountChange(n);
        // When manually adjusting the total, we reset session to prevent confusion
        setSessionCount(0);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-10 w-full max-w-xs">
      {/* Main Large Counter Area (Session Counter) */}
      <div 
        onClick={() => handleIncrement()}
        className={`
          relative w-64 h-64 rounded-full flex items-center justify-center 
          cursor-pointer select-none transition-all duration-150 active:scale-95
          shadow-[0_45px_100px_-25px_rgba(1,22,30,0.25),inset_0_-8px_20px_rgba(0,0,0,0.15),inset_0_4px_10px_rgba(255,255,255,0.2)]
          ${pulse ? 'bg-gradient-to-tr from-[#064e3b] to-[#10b981] scale-105' : 'bg-gradient-to-tr from-[#065f46] to-[#059669]'}
          group
        `}
      >
        <div className="absolute top-4 left-1/4 w-1/2 h-1/4 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-lg"></div>
        
        <div className="text-center relative z-20 pointer-events-none">
          <span className={`block text-[10px] font-black font-outfit tracking-[0.4em] uppercase mb-4 transition-opacity ${pulse ? 'opacity-50' : 'opacity-40'} text-white`}>
            Session
          </span>
          <span className={`text-8xl font-black tabular-nums font-outfit tracking-tighter transition-colors duration-300 text-white`}>
            {sessionCount}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6 w-full animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
        <button 
          onClick={handleDecrement}
          className="w-16 h-16 rounded-3xl bg-white border border-black/[0.05] shadow-sm flex items-center justify-center text-3xl font-black text-[#124559] active:scale-90 transition-transform hover:bg-[#124559]/5"
          title="Decrease Session"
        >
          −
        </button>
        <button 
          onClick={(e) => handleIncrement(e)}
          className="w-16 h-16 rounded-3xl bg-white border border-black/[0.05] shadow-sm flex items-center justify-center text-3xl font-black text-[#059669] active:scale-90 transition-transform hover:bg-[#059669]/5"
          title="Increase Session"
        >
          +
        </button>
      </div>

      <div className="flex space-x-12 items-center pt-2">
        <button 
          onClick={handleReset}
          className="text-[11px] font-black uppercase tracking-widest font-outfit text-[#124559] opacity-40 hover:opacity-100 hover:text-red-600 transition-all"
        >
          {labels.reset} Session
        </button>
        <div className="w-1.5 h-1.5 rounded-full bg-[#124559] opacity-10"></div>
        <button 
          onClick={handleAdjust}
          className="text-[11px] font-black uppercase tracking-widest font-outfit text-[#124559] opacity-40 hover:opacity-100 hover:text-[#059669] transition-all"
        >
          {labels.adjust} Total
        </button>
      </div>
    </div>
  );
};

export default Counter;