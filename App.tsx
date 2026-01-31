
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, LogEntry, Theme, View, PlannedTarget } from './types';
import { fetchDailyContent } from './services/geminiService';
import Counter from './components/Counter';
import HistoryChart from './components/HistoryChart';

const STORAGE_KEY = 'istighfar_tracker_premium_v5';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    logs: [],
    plannedTargets: [],
    todayCount: 0,
    todayTarget: null,
    dailyContent: null,
    isLoadingContent: true,
    theme: 'light',
    currentView: 'home',
    error: null,
  });

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const upcomingDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = getTodayStr();
    let initialLogs: LogEntry[] = [];
    let initialPlanned: PlannedTarget[] = [];
    let initialTheme: Theme = 'light';

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialLogs = parsed.logs || [];
        initialPlanned = parsed.plannedTargets || [];
        initialTheme = parsed.theme || 'light';
      } catch (e) { console.error(e); }
    }

    const todayLog = initialLogs.find(l => l.date === today);
    const plannedForToday = initialPlanned.find(p => p.date === today);
    
    // Logic: 1. Existing log, 2. Planned target, 3. Auto-increment
    const autoTarget = 100 + (initialLogs.length * 50);
    const resolvedTarget = todayLog ? todayLog.target : (plannedForToday ? plannedForToday.target : autoTarget);

    setState(prev => ({
      ...prev,
      logs: initialLogs,
      plannedTargets: initialPlanned,
      theme: initialTheme,
      todayCount: todayLog ? todayLog.count : 0,
      todayTarget: resolvedTarget,
    }));

    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    const initializeDaily = async () => {
      setState(prev => ({ ...prev, isLoadingContent: true }));
      const content = await fetchDailyContent();
      setState(prev => ({ ...prev, dailyContent: content, isLoadingContent: false }));
    };
    initializeDaily();
  }, []);

  // Persistent Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      logs: state.logs,
      plannedTargets: state.plannedTargets,
      theme: state.theme
    }));
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.logs, state.theme, state.plannedTargets]);

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const updateCount = useCallback((newCount: number) => {
    const today = getTodayStr();
    setState(prev => {
      const logs = [...prev.logs];
      const idx = logs.findIndex(l => l.date === today);
      const target = prev.todayTarget || 100;

      if (idx > -1) {
        logs[idx].count = newCount;
      } else {
        logs.push({ date: today, count: newCount, target });
      }
      return { ...prev, todayCount: newCount, logs };
    });
  }, [state.todayTarget]);

  const setPlanningTarget = (date: string, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      setState(prev => {
        const planned = [...prev.plannedTargets];
        const idx = planned.findIndex(p => p.date === date);
        if (idx > -1) planned[idx].target = num;
        else planned.push({ date, target: num });
        return { ...prev, plannedTargets: planned };
      });
    }
  };

  const handleSetTarget = () => {
    const num = parseInt(targetInput);
    if (!isNaN(num) && num > 0) {
      const today = getTodayStr();
      setState(prev => {
        const logs = [...prev.logs];
        const idx = logs.findIndex(l => l.date === today);
        if (idx > -1) logs[idx].target = num;
        else logs.push({ date: today, count: prev.todayCount, target: num });
        return { ...prev, todayTarget: num, logs };
      });
      setShowTargetModal(false);
      setTargetInput('');
    }
  };

  const currentStreak = useMemo(() => {
    if (state.logs.length === 0) return 0;
    const sorted = [...state.logs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = getTodayStr();
    if (sorted[0].date !== today && sorted[0].date !== new Date(Date.now() - 86400000).toISOString().split('T')[0]) return 0;
    for (let i = 0; i < sorted.length; i++) { streak++; if (i < sorted.length - 1) {
      const diff = (new Date(sorted[i].date).getTime() - new Date(sorted[i+1].date).getTime()) / 86400000;
      if (diff > 1.2) break;
    }}
    return streak;
  }, [state.logs]);

  const progressPercent = Math.min(100, (state.todayCount / (state.todayTarget || 1)) * 100);

  return (
    <div className={`min-h-screen transition-all duration-1000 pb-40 px-6 
      ${state.theme === 'dark' ? 'bg-[#020504] text-[#e8f3ee]' : 'bg-[#faf9f6] text-[#2d3a35]'}`}>
      
      {/* Dynamic Header */}
      <header className="max-w-xl mx-auto pt-16 pb-12 flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-gradient-to-br from-[#064e3b] to-[#10b981] rounded-[2rem] shadow-2xl shadow-emerald-900/40 flex items-center justify-center transform rotate-6 active:rotate-0 transition-transform duration-500">
            <span className="cinzel text-white text-3xl font-black -rotate-6">I</span>
          </div>
          <div>
            <h1 className="text-3xl font-black cinzel tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-100">ISTIGHFAR</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">The Divine Companion</p>
          </div>
        </div>
        <button onClick={toggleTheme} className="p-4 rounded-3xl glass hover:scale-110 active:scale-90 transition-all">
          {state.theme === 'light' ? (
            <svg className="w-6 h-6 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m3.343-5.657l-.707.707m12.728 12.728l-.707.707M6.343 17.657l-.707-.707M17.657 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>
      </header>

      <main className="max-w-xl mx-auto space-y-12">
        {state.currentView === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Wisdom Reveal */}
            <section className={`rounded-[3.5rem] p-12 shadow-2xl transition-all duration-700 border
              ${state.theme === 'dark' ? 'bg-[#05110c] border-emerald-900/20 shadow-emerald-950/50' : 'bg-white border-stone-100 shadow-stone-200/50'}`}>
              <div className="space-y-10 relative">
                <div className="flex items-center space-x-3 opacity-30">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Celestial Wisdom</span>
                </div>
                {state.isLoadingContent ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-emerald-900/10 rounded-2xl w-full"></div>
                    <div className="h-8 bg-emerald-900/10 rounded-2xl w-2/3"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl leading-snug serif italic font-medium tracking-tight">"{state.dailyContent?.motivation}"</p>
                    <div className="flex items-center justify-between pt-10 border-t border-emerald-500/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L9 9H1l7 5-2 9 6-5 6 5-2-9 7-5h-8l-3-8z"/></svg>
                        </div>
                        <p className="text-sm font-bold tracking-tight opacity-70">Goal: {state.dailyContent?.challenge}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Live Progress HUD */}
            <div className="px-6 space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Intention Progress</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl font-black cinzel tabular-nums">{state.todayCount}</span>
                    <span className="text-lg font-bold opacity-20 cinzel tracking-widest">/ {state.todayTarget}</span>
                  </div>
                </div>
                <button onClick={() => setShowTargetModal(true)} className="btn-divine px-10 py-5 rounded-[1.8rem] bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30">
                  Set Target
                </button>
              </div>
              <div className={`h-6 rounded-full glass p-1.5 shadow-inner ${state.theme === 'dark' ? 'bg-black/50' : 'bg-stone-200/50'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-400 to-emerald-600 transition-all duration-1000 shadow-[0_0_25px_rgba(16,185,129,0.4)]" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                 <span className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>{currentStreak} Day Streak</span></span>
                 <span>{Math.round(progressPercent)}% Accomplished</span>
              </div>
            </div>

            <Counter initialCount={state.todayCount} onCountChange={updateCount} />
          </div>
        )}

        {state.currentView === 'planner' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 px-2">
            <h2 className="text-4xl font-black cinzel tracking-tighter">Spiritual Roadmap</h2>
            <p className="text-sm opacity-50 serif italic max-w-sm">"Success lies in the intention prepared beforehand."</p>
            
            <div className="space-y-6">
              {upcomingDays.map((date, idx) => {
                const planned = state.plannedTargets.find(p => p.date === date);
                return (
                  <div key={date} className={`p-10 rounded-[2.5rem] glass flex items-center justify-between group hover:scale-[1.02] transition-all duration-300
                    ${idx === 0 ? 'ring-2 ring-emerald-500/50' : ''}`}>
                    <div className="space-y-2">
                      <span className="text-xs font-black opacity-30 uppercase tracking-[0.2em]">
                        {idx === 0 ? 'Tomorrow' : new Date(date).toLocaleDateString(undefined, { weekday: 'long' })}
                      </span>
                      <p className="text-xl font-bold tracking-tight">{new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="number"
                        placeholder="Target"
                        value={planned?.target || ''}
                        onChange={(e) => setPlanningTarget(date, e.target.value)}
                        className={`w-24 text-center py-4 rounded-2xl outline-none font-bold cinzel text-xl glass
                          ${state.theme === 'dark' ? 'bg-white/5 focus:ring-emerald-500' : 'bg-stone-50 focus:ring-emerald-400'}`}
                      />
                      <span className="text-[10px] font-black uppercase opacity-20 tracking-widest">Count</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {state.currentView === 'analytics' && (
          <div className="space-y-12 animate-in fade-in duration-700">
             <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black cinzel tracking-tighter">Grand Chronicles</h2>
              <div className="px-5 py-2.5 rounded-full glass text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 text-emerald-500">Active Journey</div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className={`p-10 rounded-[3rem] glass flex flex-col items-center text-center`}>
                <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-4">Lifetime Total</span>
                <span className="text-5xl font-black cinzel tracking-tighter text-glow">{state.logs.reduce((a,b)=>a+b.count,0).toLocaleString()}</span>
              </div>
              <div className={`p-10 rounded-[3rem] glass flex flex-col items-center text-center`}>
                <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-4">Consistency</span>
                <span className="text-5xl font-black cinzel tracking-tighter">{currentStreak}</span>
                <span className="text-[9px] mt-2 opacity-30 font-black uppercase">Day Streak</span>
              </div>
            </div>

            <HistoryChart data={state.logs} />

            <div className="p-10 rounded-[3rem] glass">
              <h3 className="text-xs font-black mb-10 opacity-30 uppercase tracking-[0.4em]">Historical Ledger</h3>
              <div className="space-y-8">
                {[...state.logs].reverse().map((log, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-sm font-bold opacity-80">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <div className="flex items-center space-x-6">
                      <div className="text-right"><span className="text-2xl font-black cinzel block">{log.count}</span><span className="text-[8px] opacity-30 font-black uppercase">Recited</span></div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.count >= log.target ? 'bg-emerald-500/20 text-emerald-500' : 'bg-stone-500/10 text-stone-500'}`}>
                        {log.count >= log.target ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> : <span className="text-[9px] font-black">{Math.round((log.count/log.target)*100)}%</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modern Navigation Dock */}
      <nav className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-6 rounded-[3rem] z-50 flex space-x-16 glass shadow-[0_40px_100px_rgba(0,0,0,0.5)] border
        ${state.theme === 'dark' ? 'border-emerald-900/30' : 'border-white/50'}`}>
        <button onClick={() => setState(s => ({ ...s, currentView: 'planner' }))} className={`flex flex-col items-center space-y-2 transition-all ${state.currentView === 'planner' ? 'text-emerald-500 scale-125' : 'opacity-20 hover:opacity-50'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/></svg>
          <span className="text-[7px] font-black uppercase tracking-widest">Planner</span>
        </button>
        <button onClick={() => setState(s => ({ ...s, currentView: 'home' }))} className={`flex flex-col items-center space-y-2 transition-all ${state.currentView === 'home' ? 'text-emerald-500 scale-125' : 'opacity-20 hover:opacity-50'}`}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11L12 2zm0 10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>
          <span className="text-[7px] font-black uppercase tracking-widest">Presence</span>
        </button>
        <button onClick={() => setState(s => ({ ...s, currentView: 'analytics' }))} className={`flex flex-col items-center space-y-2 transition-all ${state.currentView === 'analytics' ? 'text-emerald-500 scale-125' : 'opacity-20 hover:opacity-50'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>
          <span className="text-[7px] font-black uppercase tracking-widest">Journey</span>
        </button>
      </nav>

      {/* Target Intent Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-sm rounded-[4rem] p-16 glass border border-emerald-500/10 shadow-[0_0_100px_rgba(5,150,105,0.2)]">
            <h2 className="text-3xl font-black cinzel mb-4 tracking-tighter">New Intention</h2>
            <p className="text-xs opacity-50 mb-12 font-bold uppercase tracking-widest">Define your spiritual commitment for today.</p>
            <input 
              type="number" 
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={(state.todayTarget || 100).toString()}
              className="w-full text-center text-7xl font-black cinzel py-10 rounded-[3rem] mb-12 bg-white/5 outline-none focus:ring-4 ring-emerald-500/30 transition-all text-emerald-400"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-8">
              <button onClick={() => setShowTargetModal(false)} className="py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest opacity-30">Cancel</button>
              <button onClick={handleSetTarget} className="btn-divine py-6 rounded-3xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
