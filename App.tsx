
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, LogEntry, Theme, View, PlannedTarget, Language } from './types';
import { fetchDailyContent, LocalizedDailyContent } from './services/geminiService';
import Counter from './components/Counter';
import HistoryChart from './components/HistoryChart';

const STORAGE_KEY = 'istigfar_tracker_v20_stable';

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
    selectDate: "Select a date to set target",
    confirmReset: "Are you sure you want to reset today's count to zero?",
    promptAdjust: "Enter current count:"
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
    selectDate: "লক্ষ্য নির্ধারণ করতে একটি তারিখ নির্বাচন করুন",
    confirmReset: "আপনি কি আজকের গণনা শূন্য করতে চান?",
    promptAdjust: "বর্তমান সংখ্যা লিখুন:"
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { localizedContent: LocalizedDailyContent | null }>({
    logs: [],
    plannedTargets: [],
    todayCount: 0,
    todayTarget: 100, // Default target
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

  const t = translations[state.language];
  const audioContextRef = useRef<AudioContext | null>(null);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const playPing = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { console.warn("Audio failed", e); }
  }, []);

  // Initialization
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const today = getTodayStr();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const todayLog = parsed.logs?.find((l: LogEntry) => l.date === today);
        const todayPlanned = parsed.plannedTargets?.find((p: PlannedTarget) => p.date === today);

        setState(prev => ({
          ...prev,
          logs: parsed.logs || [],
          plannedTargets: parsed.plannedTargets || [],
          language: parsed.language || 'en',
          todayCount: todayLog ? todayLog.count : 0,
          todayTarget: todayPlanned ? todayPlanned.target : (todayLog ? todayLog.target : 100),
        }));
      } catch (e) { console.error(e); }
    }
    
    fetchDailyContent().then(content => {
      setState(prev => ({
        ...prev,
        localizedContent: content,
        dailyContent: content[prev.language],
        isLoadingContent: false
      }));
    });
  }, []);

  // Sync to Storage & History
  useEffect(() => {
    const today = getTodayStr();
    setState(prev => {
      const logs = [...prev.logs];
      const idx = logs.findIndex(l => l.date === today);
      const target = prev.todayTarget || 100;
      if (idx > -1) {
        if (logs[idx].count === prev.todayCount && logs[idx].target === target) return prev;
        logs[idx].count = prev.todayCount;
        logs[idx].target = target;
      } else {
        logs.push({ date: today, count: prev.todayCount, target });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        logs,
        plannedTargets: prev.plannedTargets,
        language: prev.language
      }));
      return { ...prev, logs };
    });
  }, [state.todayCount, state.todayTarget, state.plannedTargets, state.language]);

  const handleCountChange = (newCount: number) => {
    if (newCount > state.todayCount) playPing();
    setState(prev => ({ ...prev, todayCount: newCount }));
  };

  const handleLanguageSwitch = () => {
    const newLang: Language = state.language === 'en' ? 'bn' : 'en';
    setState(prev => ({
      ...prev,
      language: newLang,
      dailyContent: prev.localizedContent ? prev.localizedContent[newLang] : prev.dailyContent
    }));
  };

  const handleSetTarget = () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val >= 0) {
      const today = getTodayStr();
      if (selectedDate === today) {
        setState(prev => ({ ...prev, todayTarget: val }));
      } else {
        setState(prev => {
          const others = prev.plannedTargets.filter(p => p.date !== selectedDate);
          return { ...prev, plannedTargets: [...others, { date: selectedDate, target: val }] };
        });
      }
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

  const progressPercent = Math.min(100, (state.todayCount / (state.todayTarget || 1)) * 100);

  // Sub-views as stabilized render functions
  const renderHome = () => (
    <div className="flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-end px-4">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 font-outfit text-[#124559]">{t.progressToday}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black font-outfit text-[#124559]">{state.todayCount}</span>
              <span className="text-sm font-bold opacity-30 font-outfit text-[#124559]">/ {state.todayTarget}</span>
            </div>
          </div>
          <button 
            onClick={() => { setSelectedDate(getTodayStr()); setShowTargetModal(true); }}
            className="text-[10px] font-black uppercase tracking-widest bg-[#124559]/5 hover:bg-[#124559]/10 px-4 py-2 rounded-full transition-all text-[#124559]"
          >
            {t.setTarget}
          </button>
        </div>
        
        <div className="w-full h-1.5 bg-[#124559]/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#059669] to-[#10b981] transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <Counter 
        count={state.todayCount} 
        onCountChange={handleCountChange}
        labels={{
          recite: t.recite,
          reset: t.reset,
          adjust: t.adjust
        }}
      />

      {state.dailyContent && (
        <div className="w-full max-w-md p-8 rounded-[3rem] bg-[#064e3b]/5 border border-[#064e3b]/10 space-y-4">
          <div className="flex items-center space-x-3 opacity-40">
            <div className="w-1 h-1 rounded-full bg-[#064e3b]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-outfit text-[#064e3b]">{t.benefits}</span>
          </div>
          <p className="text-lg font-bold leading-relaxed text-[#064e3b] font-outfit italic">
            "{state.dailyContent.motivation}"
          </p>
          <div className="pt-2 border-t border-[#064e3b]/5">
            <p className="text-sm font-medium text-[#064e3b]/60 font-outfit">
              <span className="font-black uppercase text-[10px] mr-2 opacity-50">Challenge:</span>
              {state.dailyContent.challenge}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlanner = () => (
    <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="space-y-2">
        <h2 className="text-3xl font-black font-outfit text-[#124559]">{t.plannerTitle}</h2>
        <p className="text-sm font-medium opacity-40 font-outfit text-[#124559]">{t.selectDate}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[0, 1, 2, 3, 4].map(days => {
          const date = new Date();
          date.setDate(date.getDate() + days);
          const dStr = date.toISOString().split('T')[0];
          const planned = state.plannedTargets.find(p => p.date === dStr);
          const isToday = days === 0;

          return (
            <div 
              key={dStr}
              onClick={() => { setSelectedDate(dStr); setShowTargetModal(true); }}
              className="group p-6 rounded-[2.5rem] bg-white border border-black/[0.03] shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30 font-outfit block">
                  {isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })}
                </span>
                <span className="text-lg font-bold font-outfit text-[#124559]">
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-30 font-outfit block">{t.target}</span>
                  <span className="text-xl font-black font-outfit text-[#059669]">{planned ? planned.target : (isToday ? state.todayTarget : 100)}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#124559]/5 flex items-center justify-center group-hover:bg-[#124559]/10 transition-colors">
                  <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-outfit text-[#124559]">{t.navInsights}</h2>
          <p className="text-sm font-medium opacity-40 font-outfit text-[#124559]">{t.history}</p>
        </div>
        <div className="p-4 rounded-[2rem] bg-[#059669]/10 border border-[#059669]/10 text-center min-w-[100px]">
          <span className="block text-[10px] font-black uppercase tracking-widest text-[#059669] opacity-60 mb-1">{t.streak}</span>
          <span className="text-2xl font-black text-[#059669] font-outfit">{currentStreak} {t.days}</span>
        </div>
      </div>

      <HistoryChart data={state.logs} />

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 font-outfit px-4">{t.rewards}</h3>
        <div className="grid grid-cols-1 gap-3">
          {[t.reward1, t.reward2, t.reward3, t.reward4, t.reward5].map((reward, i) => (
            <div key={i} className="p-5 rounded-3xl bg-[#124559]/5 flex items-start space-x-4">
              <div className="w-6 h-6 rounded-full bg-[#124559] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-white">{i + 1}</span>
              </div>
              <p className="text-sm font-bold text-[#124559] font-outfit leading-snug">{reward}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#01161e] font-outfit selection:bg-[#059669]/20 selection:text-[#059669]">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#598392]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#059669]/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex justify-between items-center bg-[#faf9f6]/80 backdrop-blur-xl border-b border-black/[0.02]">
        <h1 className="text-xl font-black tracking-tighter text-[#124559]">{t.appName}</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleLanguageSwitch}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-black/[0.05] shadow-sm hover:shadow-md transition-all font-black text-[10px] uppercase"
          >
            {state.language === 'en' ? 'BN' : 'EN'}
          </button>
          <button 
            onClick={() => setShowSidebar(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-black/[0.05] shadow-sm hover:shadow-md transition-all"
          >
             <div className="space-y-1">
               <div className="w-4 h-0.5 bg-[#124559] rounded-full"></div>
               <div className="w-3 h-0.5 bg-[#124559] rounded-full"></div>
             </div>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-40 px-6 flex flex-col items-center">
        {state.currentView === 'home' && renderHome()}
        {state.currentView === 'planner' && renderPlanner()}
        {state.currentView === 'analytics' && renderInsights()}
      </main>

      {/* Bottom Nav Tab Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center p-2 rounded-full bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-black/[0.03]">
        {[
          { id: 'home', icon: '✦', label: t.navHome },
          { id: 'planner', icon: '◈', label: t.navPlanner },
          { id: 'analytics', icon: '◉', label: t.navInsights }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setState(prev => ({ ...prev, currentView: item.id as View }))}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300
              ${state.currentView === item.id ? 'bg-[#124559] text-white' : 'hover:bg-[#124559]/5 text-[#124559]/40'}
            `}
          >
            <span className="text-lg">{item.icon}</span>
            {state.currentView === item.id && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <h3 className="text-2xl font-black font-outfit text-[#124559]">{t.setTarget}</h3>
              <p className="text-sm font-medium opacity-40 font-outfit">{selectedDate === getTodayStr() ? 'Today' : selectedDate}</p>
            </div>
            <input 
              type="number"
              autoFocus
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. 500"
              className="w-full text-4xl font-black p-0 border-none focus:ring-0 text-[#124559] placeholder:text-[#124559]/10"
            />
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowTargetModal(false)}
                className="flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-[#124559] bg-[#124559]/5 hover:bg-[#124559]/10 transition-all"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSetTarget}
                className="flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-white bg-[#059669] shadow-lg shadow-[#059669]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t.set}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar / Settings */}
      {showSidebar && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/10 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-xs h-full bg-white p-12 shadow-2xl animate-in slide-in-from-right duration-500 relative"
          >
            <button 
              onClick={() => setShowSidebar(false)}
              className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10"
            >
              ✕
            </button>
            
            <div className="space-y-12">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">{t.appName}</span>
                <h3 className="text-2xl font-black text-[#124559]">Settings</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-30">App Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#124559]">{t.madeBy}</p>
                    <p className="text-[10px] font-medium opacity-40">Version 2.0 Stable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 cursor-pointer" onClick={() => setShowSidebar(false)}></div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-20 flex flex-col items-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-[#124559]">{t.appName}</p>
        <div className="w-8 h-1 bg-[#124559]/20 rounded-full"></div>
      </footer>
    </div>
  );
};

export default App;
