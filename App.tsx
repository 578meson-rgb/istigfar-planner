
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, LogEntry, View, PlannedTarget, Language } from './types';
import { fetchDailyContent, LocalizedDailyContent } from './services/geminiService';
import Counter from './components/Counter';
import HistoryChart from './components/HistoryChart';
import Auth from './components/Auth';
import Landing from './components/Landing';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const translations = {
  en: {
    appName: "Istighfar Tracker",
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
    madeBy: "Made by Adnan Khan",
    recite: "Recite",
    reset: "Reset",
    adjust: "Adjust",
    navHome: "Home",
    navPlanner: "Planner",
    navInsights: "Insights",
    plannerTitle: "Plan Your Journey",
    selectDate: "Select a date to set target",
    logout: "Logout",
    syncing: "Saving to Cloud...",
    refresh: "Refresh Content",
    reflection: "Reflection"
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
    madeBy: "আদনান খান দ্বারা তৈরি",
    recite: "পাঠ করুন",
    reset: "রিসেট",
    adjust: "সমন্বয়",
    navHome: "হোম",
    navPlanner: "পরিকল্পক",
    navInsights: "পরিসংখ্যান",
    plannerTitle: "আপনার যাত্রা পরিকল্পনা করুন",
    selectDate: "লক্ষ্য নির্ধারণ করতে একটি তারিখ নির্বাচন করুন",
    logout: "লগআউট",
    syncing: "ক্লাউডে সেভ হচ্ছে...",
    refresh: "নতুন তথ্য",
    reflection: "প্রতিফলন"
  }
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [state, setState] = useState<AppState & { localizedContent: LocalizedDailyContent | null, isSyncing: boolean }>({
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
    error: null,
    isSyncing: false
  });

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const t = translations[state.language];

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false);
    });

    return () => subscription.unsubscribe();
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

  // Fetch Data from Supabase
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const today = getTodayStr();
      const { data: logsData } = await supabase.from('istighfar_logs').select('*').order('date', { ascending: true });
      const { data: plannedData } = await supabase.from('planned_targets').select('*');
      const todayLog = logsData?.find(l => l.date === today);
      const todayPlanned = plannedData?.find(p => p.date === today);

      setState(prev => ({
        ...prev,
        logs: logsData || [],
        plannedTargets: plannedData || [],
        todayCount: todayLog ? todayLog.count : 0,
        todayTarget: todayPlanned ? todayPlanned.target : (todayLog ? todayLog.target : 100),
      }));
    };

    fetchData();
    loadDailyContent(state.language);
  }, [session, state.language, loadDailyContent]);

  const syncToSupabase = useCallback(async (count: number, target: number) => {
    if (!session) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    await supabase.from('istighfar_logs').upsert({
      user_id: session.user.id,
      date: getTodayStr(),
      count,
      target
    });
    setState(prev => ({ ...prev, isSyncing: false }));
  }, [session]);

  const playPing = useCallback(() => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch (e) {}
  }, []);

  const handleCountChange = (newCount: number) => {
    if (newCount > state.todayCount) playPing();
    setState(prev => ({ ...prev, todayCount: newCount }));
    syncToSupabase(newCount, state.todayTarget || 100);
  };

  const handleSetTarget = async () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val >= 0 && session) {
      const today = getTodayStr();
      if (selectedDate === today) {
        setState(prev => ({ ...prev, todayTarget: val }));
        await syncToSupabase(state.todayCount, val);
      } else {
        await supabase.from('planned_targets').upsert({ user_id: session.user.id, date: selectedDate, target: val });
        const { data } = await supabase.from('planned_targets').select('*');
        setState(prev => ({ ...prev, plannedTargets: data || [] }));
      }
      setShowTargetModal(false);
      setTargetInput('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setShowAuth(false);
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

  const totalCount = useMemo(() => state.logs.reduce((acc, curr) => acc + curr.count, 0) + state.todayCount, [state.logs, state.todayCount]);

  // View Logic
  if (!session) {
    if (showAuth) {
      return <Auth language={state.language} onBack={() => setShowAuth(false)} />;
    }
    return <Landing language={state.language} onGetStarted={() => setShowAuth(true)} />;
  }

  const progressPercent = Math.min(100, (state.todayCount / (state.todayTarget || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#01161e] font-outfit">
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex justify-between items-center bg-[#faf9f6]/80 backdrop-blur-xl border-b border-black/[0.02]">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-[#124559]">{t.appName}</h1>
          {state.isSyncing && <span className="text-[8px] font-black uppercase tracking-widest text-[#059669]">{t.syncing}</span>}
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setState(prev => ({ ...prev, language: prev.language === 'en' ? 'bn' : 'en' }))} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-black/[0.05] shadow-sm font-black text-[10px] uppercase">{state.language === 'en' ? 'BN' : 'EN'}</button>
          <button onClick={() => setShowSidebar(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-black/[0.05] shadow-sm">
             <div className="space-y-1">
               <div className="w-4 h-0.5 bg-[#124559] rounded-full"></div>
               <div className="w-3 h-0.5 bg-[#124559] rounded-full"></div>
             </div>
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-40 px-6 flex flex-col items-center">
        {state.currentView === 'home' && (
          <div className="flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 w-full max-w-md">
            <div className="w-full space-y-6">
              <div className="flex justify-between items-end px-4">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 font-outfit text-[#124559]">{t.progressToday}</h2>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black font-outfit text-[#124559]">{state.todayCount}</span>
                    <span className="text-sm font-bold opacity-30 font-outfit text-[#124559]">/ {state.todayTarget}</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedDate(getTodayStr()); setShowTargetModal(true); }} className="text-[10px] font-black uppercase tracking-widest bg-[#124559]/5 px-4 py-2 rounded-full text-[#124559]">{t.setTarget}</button>
              </div>
              <div className="w-full h-1.5 bg-[#124559]/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#059669] to-[#10b981] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <Counter count={state.todayCount} onCountChange={handleCountChange} labels={{ recite: t.recite, reset: t.reset, adjust: t.adjust }} />

            <div className="w-full space-y-4">
              {state.isLoadingContent ? (
                <div className="w-full h-40 bg-black/5 animate-pulse rounded-[3rem]" />
              ) : state.dailyContent && (
                <div className="w-full p-8 rounded-[3rem] bg-[#064e3b]/5 border border-[#064e3b]/10 space-y-6 relative group overflow-hidden">
                  <div className="space-y-4">
                    <p className="text-lg font-bold leading-relaxed text-[#064e3b] font-outfit italic">"{state.dailyContent.motivation}"</p>
                    <div className="pt-2 border-t border-[#064e3b]/5 space-y-3">
                      <p className="text-sm font-medium text-[#064e3b]/70 font-outfit">
                        <span className="font-black uppercase text-[10px] mr-2 opacity-50">Challenge:</span>
                        {state.dailyContent.challenge}
                      </p>
                      {state.dailyContent.reflection && (
                        <p className="text-xs font-medium text-[#064e3b]/50 font-outfit leading-relaxed">
                          <span className="font-black uppercase text-[9px] mr-2 opacity-40">{t.reflection}:</span>
                          {state.dailyContent.reflection}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => loadDailyContent(state.language)} className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest text-[#064e3b] opacity-0 group-hover:opacity-40 transition-opacity hover:opacity-100">{t.refresh}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {state.currentView === 'planner' && (
          <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-3xl font-black font-outfit text-[#124559]">{t.plannerTitle}</h2>
            <div className="grid grid-cols-1 gap-4">
              {[0, 1, 2, 3, 4].map(days => {
                const date = new Date(); date.setDate(date.getDate() + days);
                const dStr = date.toISOString().split('T')[0];
                const planned = state.plannedTargets.find(p => p.date === dStr);
                return (
                  <div key={dStr} onClick={() => { setSelectedDate(dStr); setShowTargetModal(true); }} className="p-6 rounded-[2.5rem] bg-white border border-black/[0.03] shadow-sm flex justify-between items-center cursor-pointer hover:border-[#059669]/20 transition-all">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30 block">{days === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })}</span>
                      <span className="text-lg font-bold text-[#124559]">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <span className="text-xl font-black text-[#059669]">{planned ? planned.target : (days === 0 ? state.todayTarget : 100)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {state.currentView === 'analytics' && (
          <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black font-outfit text-[#124559]">{t.navInsights}</h2>
              <div className="flex space-x-2">
                <div className="px-4 py-3 rounded-2xl bg-[#059669]/10 text-center">
                  <span className="text-sm font-black text-[#059669] font-outfit">{currentStreak} {t.days}</span>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-[#124559]/5 text-center">
                  <span className="text-sm font-black text-[#124559] font-outfit">{totalCount} {t.recite}</span>
                </div>
              </div>
            </div>
            <HistoryChart data={state.logs} />
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center p-2 rounded-full bg-white shadow-2xl border border-black/[0.03]">
        {[
          { id: 'home', icon: '✦', label: t.navHome },
          { id: 'planner', icon: '◈', label: t.navPlanner },
          { id: 'analytics', icon: '◉', label: t.navInsights }
        ].map((item) => (
          <button key={item.id} onClick={() => setState(prev => ({ ...prev, currentView: item.id as View }))} className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all ${state.currentView === item.id ? 'bg-[#124559] text-white' : 'text-[#124559]/40 hover:text-[#124559]'}`}>
            <span className="text-lg">{item.icon}</span>
            {state.currentView === item.id && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
          </button>
        ))}
      </div>

      {showTargetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-sm bg-white rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-[#124559]">{t.setTarget}</h3>
            <input type="number" autoFocus value={targetInput} onChange={(e) => setTargetInput(e.target.value)} className="w-full text-4xl font-black p-0 border-none focus:ring-0 text-[#124559] placeholder:text-[#124559]/10" placeholder="e.g. 500" />
            <div className="flex space-x-4">
              <button onClick={() => setShowTargetModal(false)} className="flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-[#124559] bg-[#124559]/5">{t.cancel}</button>
              <button onClick={handleSetTarget} className="flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-white bg-[#059669] shadow-lg shadow-[#059669]/20">{t.set}</button>
            </div>
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/10 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xs h-full bg-white p-12 shadow-2xl relative animate-in slide-in-from-right duration-500">
            <button onClick={() => setShowSidebar(false)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">✕</button>
            <div className="space-y-12">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">{t.appName}</span>
                <h3 className="text-2xl font-black text-[#124559]">Settings</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-[#124559] break-all">{session.user.email}</p>
                <button onClick={handleLogout} className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 transition-all">{t.logout}</button>
              </div>
              <div className="pt-12 border-t border-black/[0.05] space-y-2">
                <p className="text-sm font-bold text-[#124559]">{t.madeBy}</p>
                <p className="text-[10px] font-medium opacity-40">Version 2.0 Stable</p>
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
