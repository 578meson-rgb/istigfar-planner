
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, LogEntry, Theme, View, PlannedTarget, Language } from './types';
import { fetchDailyContent, LocalizedDailyContent } from './services/geminiService';
import Counter from './components/Counter';
import HistoryChart from './components/HistoryChart';

const STORAGE_KEY = 'istigfar_tracker_v18_reverted';

const translations = {
  en: {
    appName: "Istigfar Tracker",
    progressToday: "Progress Today",
    setTarget: "Set Target",
    roadmap: "Roadmap",
    insights: "Insights",
    streak: "Streak",
    days: "Days",
    achieved: "Achieved",
    history: "Recent History",
    tomorrow: "Tomorrow",
    target: "Target",
    set: "Set",
    cancel: "Cancel",
    benefits: "Spiritual Reflection",
    benefit1: "Door to Mercy: Constant remembrance clears the path to tranquility.",
    benefit2: "Inner Peace: It lifts the weights of the past from your heart.",
    benefit3: "Abundance: Forgiveness is the key to spiritual and worldly growth.",
    rewards: "Rewards of Istighfar",
    reward1: "Allah grants relief from every worry.",
    reward2: "A way out of every hardship.",
    reward3: "Sustenance from where one does not expect.",
    reward4: "The pleasure and love of the Creator.",
    reward5: "Purification of the soul from mistakes.",
    madeBy: "Made by Adnan Khan",
    recite: "Recite",
    reset: "Reset",
    adjust: "Adjust",
    navHome: "Home",
    navPlanner: "Planner",
    navInsights: "Insights",
    plannerTitle: "Plan Your Journey",
    selectDate: "Select a date to set target"
  },
  bn: {
    appName: "ইস্তিগফার ট্র্যাকার",
    progressToday: "আজকের অগ্রগতি",
    setTarget: "লক্ষ্য নির্ধারণ",
    roadmap: "পরিকল্পনা",
    insights: "পরিসংখ্যান",
    streak: "ধারাবাহিকতা",
    days: "দিন",
    achieved: "অর্জিত",
    history: "সাম্প্রতিক ইতিহাস",
    tomorrow: "আগামীকাল",
    target: "লক্ষ্য",
    set: "সেট",
    cancel: "বাতিল",
    benefits: "আধ্যাত্মিক প্রতিফলন",
    benefit1: "রহমতের দুয়ার: ক্রমাগত ক্ষমা প্রার্থনা প্রশান্তির পথ প্রশস্ত করে।",
    benefit2: "অন্তরের শান্তি: এটি আপনার হৃদয় থেকে অতীতের বোঝা সরিয়ে দেয়।",
    benefit3: "বরকত: ক্ষমা প্রার্থনা আধ্যাত্মিক ও পার্থিব উন্নতির চাবিকাঠি।",
    rewards: "ইস্তিগফারের সওয়াব",
    reward1: "আল্লাহ সকল দুশ্চিন্তা থেকে মুক্তি দেন।",
    reward2: "প্রতিটি কঠিন পরিস্থিতি থেকে উত্তরণের পথ।",
    reward3: "অপ্রত্যাশিত উৎস থেকে রিজিক দান।",
    reward4: "সৃষ্টিকর্তার সন্তুষ্টি ও ভালোবাসা।",
    reward5: "ভুলভ্রান্তি থেকে আত্মার পরিশুদ্ধি।",
    madeBy: "আদনান খান দ্বারা তৈরি",
    recite: "পাঠ করুন",
    reset: "রিসেট",
    adjust: "সমন্বয়",
    navHome: "হোম",
    navPlanner: "পরিকল্পক",
    navInsights: "পরিসংখ্যান",
    plannerTitle: "আপনার যাত্রা পরিকল্পনা করুন",
    selectDate: "লক্ষ্য নির্ধারণ করতে একটি তারিখ নির্বাচন করুন"
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { localizedContent: LocalizedDailyContent | null }>({
    logs: [],
    plannedTargets: [],
    todayCount: 0,
    todayTarget: null,
    dailyContent: null,
    localizedContent: null,
    isLoadingContent: true,
    theme: 'light',
    language: 'en',
    currentView: 'home',
    error: null,
  });

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const t = translations[state.language];
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevCountRef = useRef<number>(0);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const playPing = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = getTodayStr();
    let initialLogs: LogEntry[] = [];
    let initialPlanned: PlannedTarget[] = [];
    let initialLang: Language = 'en';

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialLogs = parsed.logs || [];
        initialPlanned = parsed.plannedTargets || [];
        initialLang = parsed.language || 'en';
      } catch (e) { console.error(e); }
    }

    const todayLog = initialLogs.find(l => l.date === today);
    const plannedForToday = initialPlanned.find(p => p.date === today);
    const resolvedTarget = todayLog ? todayLog.target : (plannedForToday ? plannedForToday.target : 100);

    setState(prev => ({
      ...prev,
      logs: initialLogs,
      plannedTargets: initialPlanned,
      language: initialLang,
      todayCount: todayLog ? todayLog.count : 0,
      todayTarget: resolvedTarget,
    }));

    const initializeDaily = async () => {
      setState(prev => ({ ...prev, isLoadingContent: true }));
      const content = await fetchDailyContent();
      setState(prev => ({ 
        ...prev, 
        localizedContent: content,
        dailyContent: content[prev.language],
        isLoadingContent: false 
      }));
    };
    initializeDaily();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      logs: state.logs,
      plannedTargets: state.plannedTargets,
      theme: 'light',
      language: state.language
    }));
  }, [state.logs, state.plannedTargets, state.language]);

  useEffect(() => {
    if (state.localizedContent) {
      setState(prev => ({ ...prev, dailyContent: prev.localizedContent![prev.language] }));
    }
  }, [state.language, state.localizedContent]);

  // Sync today's count to logs
  useEffect(() => {
    const today = getTodayStr();
    setState(prev => {
      const logs = [...prev.logs];
      const idx = logs.findIndex(l => l.date === today);
      const target = prev.todayTarget || 100;
      if (idx > -1) {
        logs[idx].count = prev.todayCount;
        logs[idx].target = target;
      } else {
        logs.push({ date: today, count: prev.todayCount, target });
      }
      return { ...prev, logs };
    });
  }, [state.todayCount, state.todayTarget]);

  // Ping sound logic
  useEffect(() => {
    if (state.todayTarget !== null && state.todayCount >= state.todayTarget && prevCountRef.current < state.todayTarget) {
      playPing();
    }
    prevCountRef.current = state.todayCount;
  }, [state.todayCount, state.todayTarget, playPing]);

  const updateCount = (newCount: number) => {
    setState(prev => ({ ...prev, todayCount: newCount }));
  };

  const handleSetTarget = () => {
    const num = parseInt(targetInput);
    if (!isNaN(num) && num >= 0) {
      const today = getTodayStr();
      setState(prev => {
        const updatedPlanned = [...prev.plannedTargets];
        const idx = updatedPlanned.findIndex(p => p.date === selectedDate);
        if (idx > -1) updatedPlanned[idx].target = num;
        else updatedPlanned.push({ date: selectedDate, target: num });

        let newTodayTarget = prev.todayTarget;
        if (selectedDate === today) {
          newTodayTarget = num;
        }
        
        return { ...prev, todayTarget: newTodayTarget, plannedTargets: updatedPlanned };
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
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].count > 0) {
        streak++;
        if (i < sorted.length - 1) {
          const d1 = new Date(sorted[i].date);
          const d2 = new Date(sorted[i+1].date);
          const diff = (d1.getTime() - d2.getTime()) / 86400000;
          if (diff > 1.2) break;
        }
      } else if (sorted[i].date !== today) {
        break;
      }
    }
    return streak;
  }, [state.logs]);

  const progressPercent = Math.min(100, (state.todayCount / (state.todayTarget || 1)) * 100);

  const Logo = () => (
    <div className="relative w-9 h-9 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#7af0bb] rounded-full blur-[2px] opacity-30"></div>
      <div className="absolute inset-1.5 bg-[#124559] rounded-full shadow-lg border border-black/5"></div>
      <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
    </div>
  );

  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i).toISOString().split('T')[0]);
    return days;
  }, [calendarViewDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarViewDate(newDate);
  };

  return (
    <div className={`min-h-screen pb-48 px-6 overflow-x-hidden flex flex-col bg-[#eff6e0] text-[#01161e] ${state.language === 'bn' ? 'font-bangla' : 'font-jakarta'}`}>
      
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] transition-opacity duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSidebar(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-xl z-[101] p-8 transition-transform duration-500 transform border-r border-black/5 shadow-2xl ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-outfit font-black tracking-tight text-[#124559] uppercase">{t.rewards}</h2>
          <button onClick={() => setShowSidebar(false)} className="p-2 -mr-2 opacity-60 hover:opacity-100 transition-opacity text-[#01161e]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-6">
          {[t.reward1, t.reward2, t.reward3, t.reward4, t.reward5].map((reward, i) => (
            <div key={i} className="flex space-x-4 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
               <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] mt-1.5 flex-shrink-0 shadow-sm"></div>
               <p className="text-[14px] text-[#01161e] font-bold leading-relaxed">{reward}</p>
            </div>
          ))}
        </div>
      </aside>
      
      {/* Header */}
      <header className="max-w-xl w-full mx-auto pt-8 pb-4 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowSidebar(true)}
            className="p-2.5 -ml-2 rounded-2xl bg-white shadow-sm border border-black/5 hover:bg-black/5 transition-colors"
          >
            <svg className="w-6 h-6 text-[#124559]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
          <div className="flex items-center space-x-3">
            <Logo />
            <h1 className="text-lg sm:text-xl font-outfit font-black tracking-tight text-[#124559]">{t.appName}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setState(s => ({ ...s, language: s.language === 'en' ? 'bn' : 'en' }))}
            className="px-5 py-2.5 rounded-2xl bg-white shadow-sm border border-black/5 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-black/5 text-[#124559]"
          >
            {state.language === 'en' ? 'BN' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl w-full mx-auto flex-grow flex flex-col">
        {state.currentView === 'home' && (
          <div className="flex flex-col items-center flex-grow animate-in fade-in duration-1000">
            {/* Daily Motivation */}
            <div className="w-full max-w-xs text-center py-6 min-h-[70px] flex items-center justify-center">
              {state.isLoadingContent ? (
                <div className="h-3 bg-black/5 rounded-full animate-pulse w-3/4"></div>
              ) : (
                <p className="text-[14px] leading-relaxed italic font-black px-4 text-black text-balance">
                  {state.dailyContent?.motivation}
                </p>
              )}
            </div>

            {/* Central Counter */}
            <div className="relative py-2">
              <Counter 
                count={state.todayCount} 
                onCountChange={updateCount} 
                labels={{ recite: t.recite, reset: t.reset, adjust: t.adjust }} 
              />
            </div>

            {/* Target Display */}
            <div className="w-full max-w-sm space-y-8 mt-6 px-2">
              <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#124559] opacity-70">{t.progressToday}</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl font-black font-outfit tabular-nums text-[#01161e]">{state.todayCount}</span>
                    <span className="text-base font-bold text-[#124559] opacity-40">/ {state.todayTarget}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedDate(getTodayStr()); setShowTargetModal(true); }} 
                  className="px-6 py-3.5 rounded-2xl bg-[#124559] text-[#eff6e0] text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-[#01161e] active:scale-95"
                >
                  {t.setTarget}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-4 w-full bg-white rounded-full overflow-hidden shadow-inner border border-black/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#124559] via-[#10b981] to-[#7af0bb] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Statistics */}
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-[#124559]">
                 <span className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-sm"></div>
                    <span>{t.streak}: {currentStreak} {t.days}</span>
                 </span>
                 <span className="opacity-80">{Math.round(progressPercent)}% {t.achieved}</span>
              </div>
            </div>

            {/* Reflection Section */}
            <section className="w-full mt-12 mb-8 p-10 rounded-[3.5rem] bg-white shadow-2xl shadow-black/[0.03] flex flex-col space-y-8 border border-black/[0.03]">
              <div className="flex items-center space-x-4 opacity-30">
                <div className="h-[1px] flex-grow bg-black"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap text-black">{t.benefits}</h3>
                <div className="h-[1px] flex-grow bg-black"></div>
              </div>
              <div className="grid gap-6">
                {[t.benefit1, t.benefit2, t.benefit3].map((b, i) => (
                  <div key={i} className="flex space-x-5 group">
                    <span className="text-[#10b981] font-outfit font-black text-sm opacity-30 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                    <p className="text-[14px] leading-relaxed text-[#01161e] font-bold opacity-80 group-hover:opacity-100 transition-opacity">{b}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {state.currentView === 'planner' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-12">
            <h2 className="text-2xl font-black uppercase tracking-widest text-[#124559] px-2">{t.plannerTitle}</h2>
            
            <div className="p-8 rounded-[3rem] bg-white shadow-2xl border border-black/[0.03]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-[#124559] font-outfit">
                  {calendarViewDate.toLocaleDateString(state.language === 'en' ? 'en-US' : 'bn-BD', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex space-x-2">
                  <button onClick={() => changeMonth(-1)} className="p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => changeMonth(1)} className="p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['S','M','T','W','T','F','S'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-[#124559] opacity-30">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                  const dayNum = date.split('-')[2];
                  const hasTarget = state.plannedTargets.some(p => p.date === date);
                  const isSelected = selectedDate === date;
                  const isToday = date === getTodayStr();

                  return (
                    <button 
                      key={date}
                      onClick={() => { setSelectedDate(date); setShowTargetModal(true); }}
                      className={`
                        aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative group
                        ${isSelected ? 'bg-[#124559] text-white shadow-lg' : 'bg-black/5 hover:bg-black/10 text-[#01161e]'}
                        ${isToday && !isSelected ? 'ring-2 ring-[#10b981]' : ''}
                      `}
                    >
                      <span className="text-sm font-black font-outfit">{dayNum}</span>
                      {hasTarget && (
                        <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#10b981]'}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-[11px] font-bold text-[#124559] opacity-50 uppercase tracking-widest">{t.selectDate}</p>
          </div>
        )}

        {state.currentView === 'analytics' && (
          <div className="space-y-10 animate-in fade-in duration-700 pb-12">
             <h2 className="text-2xl font-black uppercase tracking-widest text-[#124559] px-2">{t.insights}</h2>
             <HistoryChart data={state.logs} />
             <div className="p-10 rounded-[3.5rem] bg-white border border-black/[0.03] shadow-2xl shadow-black/[0.03]">
                <h3 className="text-[11px] font-black mb-10 opacity-40 uppercase tracking-widest text-black">{t.history}</h3>
                <div className="space-y-6">
                  {[...state.logs].reverse().slice(0, 5).map((log, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <span className="text-xs font-bold text-[#124559] opacity-60">{new Date(log.date).toLocaleDateString(state.language === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'short' })}</span>
                      <div className="flex items-center space-x-5">
                        <span className="text-2xl font-black font-outfit text-[#01161e]">{log.count}</span>
                        <div className={`w-3 h-3 rounded-full ${log.count >= log.target ? 'bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-black/5'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-5 rounded-[3.5rem] z-50 flex items-center justify-between w-[90%] max-w-md bg-white/95 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-black/5">
        <button 
          onClick={() => setState(s => ({ ...s, currentView: 'home' }))} 
          className={`flex flex-col items-center transition-all duration-300 ${state.currentView === 'home' ? 'text-[#10b981] scale-110' : 'text-black opacity-30 hover:opacity-100'}`}
        >
          <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11L12 2zm0 10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navHome}</span>
        </button>

        <button 
          onClick={() => setState(s => ({ ...s, currentView: 'planner' }))} 
          className={`flex flex-col items-center transition-all duration-300 ${state.currentView === 'planner' ? 'text-[#10b981] scale-110' : 'text-black opacity-30 hover:opacity-100'}`}
        >
          <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navPlanner}</span>
        </button>

        <button 
          onClick={() => setState(s => ({ ...s, currentView: 'analytics' }))} 
          className={`flex flex-col items-center transition-all duration-300 ${state.currentView === 'analytics' ? 'text-[#10b981] scale-110' : 'text-black opacity-30 hover:opacity-100'}`}
        >
          <svg className="w-7 h-7 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-wider">{t.navInsights}</span>
        </button>
      </nav>

      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#01161e]/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="w-full max-w-sm rounded-[4rem] p-12 bg-white shadow-2xl border border-black/5 animate-in zoom-in-95 duration-300">
            <h2 className="text-[12px] font-black mb-8 text-center uppercase tracking-[0.5em] text-[#124559] opacity-40">
              {new Date(selectedDate).toLocaleDateString(state.language === 'en' ? 'en-US' : 'bn-BD', { day: 'numeric', month: 'short' })} {t.target}
            </h2>
            <input 
              type="number" 
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={(state.plannedTargets.find(p => p.date === selectedDate)?.target || 100).toString()}
              className="w-full text-center text-8xl font-black font-outfit py-10 rounded-[2.5rem] mb-12 bg-[#eff6e0] outline-none text-[#124559] shadow-inner"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-6">
              <button 
                onClick={() => { setShowTargetModal(false); setTargetInput(''); }} 
                className="py-6 rounded-[2rem] text-[12px] font-black uppercase tracking-widest text-[#124559] opacity-40 hover:opacity-100 transition-opacity"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSetTarget} 
                className="py-6 rounded-[2rem] bg-[#124559] text-white text-[12px] font-black uppercase tracking-widest shadow-2xl transition-all hover:bg-[#01161e]"
              >
                {t.set}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-16 text-center opacity-40 hover:opacity-100 transition-opacity duration-500">
         <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#124559]">{t.madeBy}</p>
      </footer>
    </div>
  );
};

export default App;
