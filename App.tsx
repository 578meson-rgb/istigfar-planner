import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, LogEntry, View, PlannedTarget, Language } from './types';
import { fetchDailyContent, LocalizedDailyContent } from './services/geminiService';
import Counter from './components/Counter';
import HistoryChart from './components/HistoryChart';

const translations = {
  en: {
    appName: "Istighfar Tracker",
    welcome: "Welcome to Istighfar Tracker",
    instruction: "Tap the circle to begin your remembrance. Seek forgiveness with a present heart.",
    progressToday: "Daily Total",
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
    madeBy: "Made by Adnan Khan",
    recite: "Recite",
    reset: "Clear",
    adjust: "Adjust",
    navHome: "Home",
    navPlanner: "Planner",
    navInsights: "Insights",
    plannerTitle: "Plan Your Journey",
    selectDate: "Select a date to set target",
    refresh: "Refresh Content",
    reflection: "Reflection",
    settings: "Settings"
  },
  bn: {
    appName: "ইস্তিগফার ট্র্যাকার",
    welcome: "ইস্তিগফার ট্র্যাকারে আপনাকে স্বাগতম",
    instruction: "আপনার জিকির শুরু করতে বৃত্তটিতে স্পর্শ করুন। একাগ্রচিত্তে ক্ষমা প্রার্থনা করুন।",
    progressToday: "আজকের মোট",
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
    madeBy: "আদনান খান দ্বারা তৈরি",
    recite: "পাঠ করুন",
    reset: "মুছুন",
    adjust: "সমন্বয়",
    navHome: "হোম",
    navPlanner: "পরিকল্পক",
    navInsights: "পরিসংখ্যান",
    plannerTitle: "আপনার যাত্রা পরিকল্পনা করুন",
    selectDate: "লক্ষ্য নির্ধারণ করতে একটি তারিখ নির্বাচন করুন",
    refresh: "নতুন তথ্য",
    reflection: "প্রতিফলন",
    settings: "সেটিংস"
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { localizedContent: LocalizedDailyContent | null }>({
    logs: [],
    plannedTargets: [],
    todayCount: 0,
    todayTarget: 100,
    dailyContent: null,
    localizedContent: null,
    isLoadingContent: true,
    theme: 'light',
    language: 'en',
    currentView: 'home',
    error: null
  });

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isNavVisible, setIsNavVisible] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const t = translations[state.language];

  // Handle Scroll Visibility for Nav based on page percentage
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      
      const scrollPercentage = window.scrollY / scrollHeight;

      // Show if scrolled down past 55%
      if (scrollPercentage >= 0.55) {
        setIsNavVisible(true);
      } 
      // Hide if scrolled up past 45% (scrolling from bottom to top)
      else if (scrollPercentage <= 0.45) {
        setIsNavVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check in case page is short or already scrolled
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Initial Data from LocalStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('istighfar_logs');
    const savedPlanned = localStorage.getItem('istighfar_planned');
    const logs: LogEntry[] = savedLogs ? JSON.parse(savedLogs) : [];
    const planned: PlannedTarget[] = savedPlanned ? JSON.parse(savedPlanned) : [];
    
    const today = getTodayStr();
    const todayLog = logs.find(l => l.date === today);
    const todayPlanned = planned.find(p => p.date === today);

    setState(prev => ({
      ...prev,
      logs,
      plannedTargets: planned,
      todayCount: todayLog ? todayLog.count : 0,
      todayTarget: todayPlanned ? todayPlanned.target : (todayLog ? todayLog.target : 100),
    }));

    loadDailyContent(state.language);
  }, []);

  const loadDailyContent = useCallback(async (lang: Language) => {
    setState(prev => ({ ...prev, isLoadingContent: true }));
    const content = await fetchDailyContent();
    setState(prev => ({
      ...prev,
      localizedContent: content,
      dailyContent: content[lang],
      isLoadingContent: false
    }));
  }, []);

  // Save to LocalStorage helper
  const saveStateToLocal = (logs: LogEntry[], planned: PlannedTarget[]) => {
    localStorage.setItem('istighfar_logs', JSON.stringify(logs));
    localStorage.setItem('istighfar_planned', JSON.stringify(planned));
  };

  const playTargetBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }, []);

  const handleCountChange = (newCount: number) => {
    // ONLY play sound when target is exactly met
    if (newCount === state.todayTarget && newCount > 0) {
      playTargetBeep();
    }
    
    const today = getTodayStr();
    const updatedLogs = [...state.logs];
    const index = updatedLogs.findIndex(l => l.date === today);
    
    if (index > -1) {
      updatedLogs[index] = { ...updatedLogs[index], count: newCount };
    } else {
      updatedLogs.push({ date: today, count: newCount, target: state.todayTarget || 100 });
    }

    setState(prev => ({ ...prev, todayCount: newCount, logs: updatedLogs }));
    saveStateToLocal(updatedLogs, state.plannedTargets);
  };

  const handleSetTarget = () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val >= 0) {
      const today = getTodayStr();
      let updatedLogs = [...state.logs];
      let updatedPlanned = [...state.plannedTargets];

      if (selectedDate === today) {
        setState(prev => ({ ...prev, todayTarget: val }));
        const index = updatedLogs.findIndex(l => l.date === today);
        if (index > -1) {
          updatedLogs[index] = { ...updatedLogs[index], target: val };
        } else {
          updatedLogs.push({ date: today, count: state.todayCount, target: val });
        }
      } else {
        const pIndex = updatedPlanned.findIndex(p => p.date === selectedDate);
        if (pIndex > -1) {
          updatedPlanned[pIndex] = { ...updatedPlanned[pIndex], target: val };
        } else {
          updatedPlanned.push({ date: selectedDate, target: val });
        }
      }

      setState(prev => ({ ...prev, logs: updatedLogs, plannedTargets: updatedPlanned }));
      saveStateToLocal(updatedLogs, updatedPlanned);
      setShowTargetModal(false);
      setTargetInput('');
    }
  };

  const currentStreak = useMemo(() => {
    const sorted = [...state.logs].sort((a, b) => b.date.localeCompare(a.date));
    let s = 0;
    let check = new Date();
    if (state.todayCount === 0) check.setDate(check.getDate() - 1);
    while (true) {
      const dStr = check.toISOString().split('T')[0];
      const found = sorted.find(l => l.date === dStr);
      if (found && found.count > 0) {
        s++;
        check.setDate(check.getDate() - 1);
      } else break;
      if (s > 365) break; 
    }
    return s;
  }, [state.logs, state.todayCount]);

  const totalCount = useMemo(() => state.logs.reduce((acc, curr) => acc + curr.count, 0), [state.logs]);

  const progressPercent = Math.min(100, (state.todayCount / (state.todayTarget || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#01161e] font-outfit selection:bg-[#059669]/10">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#7af0bb]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#598392]/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-10 flex justify-between items-center bg-[#faf9f6]/80 backdrop-blur-xl border-b border-black/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#059669]"></div>
          <h1 className="text-xl font-black tracking-tighter text-[#124559] uppercase">{t.appName}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setState(prev => ({ ...prev, language: prev.language === 'en' ? 'bn' : 'en' }))} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-black/[0.05] shadow-sm font-black text-[10px] uppercase transition-all active:scale-95">{state.language === 'en' ? 'BN' : 'EN'}</button>
          <button onClick={() => setShowSidebar(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-black/[0.05] shadow-sm transition-all active:scale-95">
             <div className="space-y-1">
               <div className="w-4 h-0.5 bg-[#124559] rounded-full"></div>
               <div className="w-3 h-0.5 bg-[#124559] rounded-full"></div>
             </div>
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-40 pb-44 px-6 flex flex-col items-center max-w-lg mx-auto">
        {state.currentView === 'home' && (
          <div className="flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 w-full">
            <div className="text-center space-y-3 w-full px-4">
              <h2 className="text-4xl md:text-5xl font-black text-[#124559] tracking-tighter leading-tight">
                {t.welcome}
              </h2>
              <p className="text-sm font-medium text-[#124559]/50 leading-relaxed max-w-xs mx-auto">
                {t.instruction}
              </p>
            </div>

            <div className="w-full space-y-8">
              <div className="flex justify-between items-end px-4">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-[#124559]">{t.progressToday}</h2>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-5xl font-black text-[#124559]">{state.todayCount}</span>
                    <span className="text-sm font-bold opacity-30 text-[#124559]">/ {state.todayTarget}</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedDate(getTodayStr()); setShowTargetModal(true); }} className="text-[10px] font-black uppercase tracking-widest bg-[#124559]/5 px-5 py-2.5 rounded-full text-[#124559] hover:bg-[#124559]/10 transition-colors">{t.setTarget}</button>
              </div>
              <div className="w-full h-2 bg-[#124559]/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#059669] to-[#10b981] transition-all duration-1000 shadow-sm" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <Counter count={state.todayCount} onCountChange={handleCountChange} labels={{ recite: t.recite, reset: t.reset, adjust: t.adjust }} />

            <div className="w-full">
              {state.isLoadingContent ? (
                <div className="w-full h-44 bg-black/5 animate-pulse rounded-[3.5rem]" />
              ) : state.dailyContent && (
                <div className="w-full p-10 rounded-[3.5rem] bg-white border border-black/[0.03] space-y-8 relative group shadow-sm">
                  <div className="space-y-6">
                    <p className="text-xl font-bold leading-relaxed text-[#064e3b] italic">"{state.dailyContent.motivation}"</p>
                    <div className="pt-6 border-t border-black/[0.03] space-y-4">
                      <p className="text-sm font-medium text-[#124559]/70 leading-relaxed">
                        <span className="font-black uppercase text-[10px] mr-3 opacity-40">Challenge:</span>
                        {state.dailyContent.challenge}
                      </p>
                      {state.dailyContent.reflection && (
                        <p className="text-xs font-medium text-[#124559]/50 leading-relaxed">
                          <span className="font-black uppercase text-[9px] mr-3 opacity-30">{t.reflection}:</span>
                          {state.dailyContent.reflection}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => loadDailyContent(state.language)} className="absolute top-6 right-6 text-[9px] font-black uppercase tracking-widest text-[#124559] opacity-0 group-hover:opacity-30 transition-opacity hover:opacity-100">{t.refresh}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {state.currentView === 'planner' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <h2 className="text-4xl font-black text-[#124559] tracking-tighter">{t.plannerTitle}</h2>
            <div className="grid grid-cols-1 gap-4">
              {[0, 1, 2, 3, 4, 5, 6].map(days => {
                const date = new Date(); date.setDate(date.getDate() + days);
                const dStr = date.toISOString().split('T')[0];
                const planned = state.plannedTargets.find(p => p.date === dStr);
                const log = state.logs.find(l => l.date === dStr);
                return (
                  <div key={dStr} onClick={() => { setSelectedDate(dStr); setShowTargetModal(true); }} className="p-8 rounded-[3rem] bg-white border border-black/[0.03] shadow-sm flex justify-between items-center cursor-pointer hover:border-[#059669]/20 transition-all active:scale-[0.98]">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30 block">{days === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })}</span>
                      <span className="text-lg font-bold text-[#124559]">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-black text-[#059669]">{planned ? planned.target : (log ? log.target : 100)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {state.currentView === 'analytics' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex flex-col space-y-4">
              <h2 className="text-4xl font-black text-[#124559] tracking-tighter">{t.navInsights}</h2>
              <div className="flex space-x-3">
                <div className="flex-1 p-6 rounded-[2.5rem] bg-[#059669]/5 text-center">
                  <span className="text-xl font-black text-[#059669] block">{currentStreak}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#059669] opacity-50">{t.streak}</span>
                </div>
                <div className="flex-1 p-6 rounded-[2.5rem] bg-[#124559]/5 text-center">
                  <span className="text-xl font-black text-[#124559] block">{totalCount}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#124559] opacity-50">Total</span>
                </div>
              </div>
            </div>
            <HistoryChart data={state.logs} />
          </div>
        )}
      </main>

      {/* Floating Bottom Nav - Custom scroll-based visibility with hysteresis (55% / 45%) */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center p-2 rounded-full bg-white/80 backdrop-blur-2xl shadow-2xl border border-black/[0.03] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}>
        {[
          { id: 'home', icon: '✦', label: t.navHome },
          { id: 'planner', icon: '◈', label: t.navPlanner },
          { id: 'analytics', icon: '◉', label: t.navInsights }
        ].map((item) => (
          <button key={item.id} onClick={() => setState(prev => ({ ...prev, currentView: item.id as View }))} className={`flex items-center space-x-3 px-8 py-4 rounded-full transition-all active:scale-95 ${state.currentView === item.id ? 'bg-[#124559] text-white shadow-lg shadow-[#124559]/20' : 'text-[#124559]/40 hover:text-[#124559]'}`}>
            <span className="text-xl">{item.icon}</span>
            {state.currentView === item.id && <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/10 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-[4rem] p-12 shadow-2xl space-y-10 animate-in zoom-in duration-300">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
              <h3 className="text-3xl font-black text-[#124559] tracking-tighter">{t.setTarget}</h3>
            </div>
            <input type="number" autoFocus value={targetInput} onChange={(e) => setTargetInput(e.target.value)} className="w-full text-5xl font-black p-0 border-none focus:ring-0 text-[#124559] placeholder:text-[#124559]/10" placeholder="500" />
            <div className="flex space-x-4">
              <button onClick={() => setShowTargetModal(false)} className="flex-1 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest text-[#124559] bg-[#124559]/5 hover:bg-[#124559]/10 transition-colors">{t.cancel}</button>
              <button onClick={handleSetTarget} className="flex-1 py-6 rounded-3xl text-[10px] font-black uppercase tracking-widest text-white bg-[#059669] shadow-xl shadow-[#059669]/20 hover:bg-[#047857] transition-colors">{t.set}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Settings */}
      {showSidebar && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/5 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xs h-full bg-white p-14 shadow-2xl relative animate-in slide-in-from-right duration-500">
            <button onClick={() => setShowSidebar(false)} className="absolute top-10 right-10 w-12 h-12 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">✕</button>
            <div className="space-y-16">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#059669] opacity-40">{t.appName}</span>
                <h3 className="text-3xl font-black text-[#124559] tracking-tighter">{t.settings}</h3>
              </div>
              <div className="space-y-8">
                 <div className="p-8 rounded-[3rem] bg-[#124559]/5 space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#124559] opacity-40">Persistence</h4>
                   <p className="text-sm font-medium text-[#124559] leading-relaxed">Your journey is saved automatically on this device.</p>
                 </div>
              </div>
              <div className="pt-16 border-t border-black/[0.03] space-y-3">
                <p className="text-sm font-bold text-[#124559]">{t.madeBy}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Version 3.0 Stable</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowSidebar(false)}></div>
        </div>
      )}
    </div>
  );
};

export default App;