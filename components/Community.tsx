import React, { useState, useEffect } from 'react';
import { 
  User, 
  signInWithGoogle, 
  logoutUser, 
  subscribeToCommunityUsers, 
  UserProfile, 
  syncUserDataToFirestore 
} from '../lib/firebase';
import { Language } from '../types';

interface CommunityProps {
  currentUser: User | null;
  guestUser: { uid: string; displayName: string; photoURL?: string } | null;
  onSetGuestUser: (guest: { uid: string; displayName: string; photoURL?: string } | null) => void;
  language: Language;
  todayCount: number;
  totalCount: number;
  todayDate: string;
}

const communityTranslations = {
  en: {
    title: "Community Database",
    subtitle: "Connect with reciters worldwide and view global Istighfar progress.",
    loginPromptTitle: "Join Community Database",
    loginPromptDesc: "Istighfar Tracker saves your personal count locally in your browser cache. To feature your count in the global database and see other reciters, please sign in.",
    signInBtn: "Sign in with Google",
    signOutBtn: "Sign Out",
    globalTotal: "Global Istighfars",
    todayGlobal: "Today's Global Total",
    activeReciters: "Active Reciters",
    reciterListTitle: "Top Reciters & Community Members",
    searchPlaceholder: "Search reciter by name...",
    mashaAllah: "MashaAllah",
    syncedBadge: "Cloud Synced",
    guestNotice: "Using offline browser cache",
    noUsersFound: "No reciters found matching search.",
    todayLabel: "Today",
    totalLabel: "Total",
    domainErrorTitle: "Firebase Authorized Domain Setup Required",
    domainErrorDesc: "Firebase OAuth requires your application domain to be authorized in the Firebase Console.",
    copyDomain: "Copy Domain Name",
    copied: "Copied!",
    openConsole: "Open Firebase Console Settings",
    domainInstructions: "Steps: 1. Click 'Open Firebase Console Settings' -> 2. Under 'Authorized domains', click 'Add domain' -> 3. Paste the domain below:",
    guestFallbackTitle: "Or Join with Guest Name",
    guestFallbackDesc: "You can also set a display name to post your counts to the live database immediately:",
    enterName: "Enter your name...",
    joinGuestBtn: "Join Community",
    switchUser: "Switch Profile"
  },
  bn: {
    title: "কমিউনিটি ডাটাবেস",
    subtitle: "বিশ্বজুড়ে অন্যান্য রেসিটারদের সাথে যুক্ত হন এবং গ্লোবাল ইস্তিগফার দেখুন।",
    loginPromptTitle: "কমিউনিটি ডাটাবেসে যোগ দিন",
    loginPromptDesc: "ইস্তিগফার ট্র্যাকার আপনার ব্যক্তিগত গণনা ব্রাউজার ক্যাশে সংরক্ষণ করে। গ্লোবাল ডাটাবেসে যুক্ত হতে এবং অন্যান্য রেসিটারদের দেখতে সাইন ইন করুন।",
    signInBtn: "গুগল দিয়ে সাইন ইন করুন",
    signOutBtn: "সাইন আউট",
    globalTotal: "সর্বমোট গ্লোবাল ইস্তিগফার",
    todayGlobal: "আজকের গ্লোবাল মোট",
    activeReciters: "সক্রিয় সদস্য",
    reciterListTitle: "শীর্ষ রেসিটার এবং কমিউনিটি সদস্যবৃন্দ",
    searchPlaceholder: "নাম দিয়ে সদস্য খুঁজুন...",
    mashaAllah: "মাশাআল্লাহ",
    syncedBadge: "ক্লাউড সিঙ্কড",
    guestNotice: "অফলাইন ব্রাউজার ক্যাশে ব্যবহৃত হচ্ছে",
    noUsersFound: "কোন সদস্য পাওয়া যায়নি।",
    todayLabel: "আজ",
    totalLabel: "মোট",
    domainErrorTitle: "ফায়ারবেস অথরাইজড ডোমেইন সেটআপ প্রয়োজন",
    domainErrorDesc: "ফায়ারবেস গুগল লগইনের জন্য আপনার অ্যাপের ডোমেইনটি ফায়ারবেস কনসোলে অনুমোদিত করতে হবে।",
    copyDomain: "ডোমেইন নাম কপি করুন",
    copied: "কপি হয়েছে!",
    openConsole: "ফায়ারবেস কনসোল খুলুন",
    domainInstructions: "ধাপ: ১. 'ফায়ারবেস কনসোল খুলুন' এ যান -> ২. 'Authorized domains' এ 'Add domain' চাপুন -> ৩. নিচের ডোমেইনটি পেস্ট করুন:",
    guestFallbackTitle: "অথবা নাম দিয়ে এখনই যোগ দিন",
    guestFallbackDesc: "আপনি একটি ডিসপ্লে নাম সেট করে সরাসরি লাইভ ডাটাবেসে যুক্ত হতে পারেন:",
    enterName: "আপনার নাম লিখুন...",
    joinGuestBtn: "কমিউনিটিতে যোগ দিন",
    switchUser: "প্রোফাইল পরিবর্তন"
  }
};

const Community: React.FC<CommunityProps> = ({
  currentUser,
  guestUser,
  onSetGuestUser,
  language,
  todayCount,
  totalCount,
  todayDate
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [mashaallahCounts, setMashaallahCounts] = useState<{ [uid: string]: number }>({});

  const t = communityTranslations[language];
  const activeUser = currentUser || guestUser;
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  // Subscribe to live community users snapshot from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCommunityUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });
    return () => unsubscribe();
  }, []);

  // Sync active user profile & count to Firestore
  useEffect(() => {
    if (activeUser) {
      syncUserDataToFirestore(activeUser, todayCount, totalCount, todayDate);
    }
  }, [activeUser, todayCount, totalCount, todayDate]);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setDomainError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSetGuestUser(null);
        await syncUserDataToFirestore(user, todayCount, totalCount, todayDate);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'))) {
        setDomainError(err.message || 'auth/unauthorized-domain');
      } else {
        alert("Failed to sign in with Google: " + (err?.message || "Unknown error"));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateGuestProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameInput.trim()) return;
    const newGuest = {
      uid: 'guest_' + Math.random().toString(36).substr(2, 9),
      displayName: guestNameInput.trim(),
      photoURL: ''
    };
    onSetGuestUser(newGuest);
    syncUserDataToFirestore(newGuest, todayCount, totalCount, todayDate);
  };

  const handleSignOut = async () => {
    if (currentUser) {
      await logoutUser();
    }
    onSetGuestUser(null);
  };

  const copyDomainToClipboard = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMashaAllahClick = (uid: string) => {
    setMashaallahCounts(prev => ({
      ...prev,
      [uid]: (prev[uid] || 0) + 1
    }));
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  // Compute community stats
  const aggregateGlobalTotal = users.reduce((acc, u) => acc + (u.totalCount || 0), 0);
  const aggregateTodayTotal = users.reduce((acc, u) => acc + (u.todayCount || 0), 0);

  const filteredUsers = users.filter(u => 
    (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Title */}
      <div className="text-center space-y-3 px-4">
        <h2 className="text-4xl md:text-5xl font-black text-[#124559] tracking-tighter leading-tight">
          {t.title}
        </h2>
        <p className="text-sm font-medium text-[#124559]/60 max-w-sm mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Global Aggregates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-[2.5rem] bg-[#124559] text-white shadow-lg space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 block">
            {t.globalTotal}
          </span>
          <span className="text-3xl font-black tracking-tight block">
            {aggregateGlobalTotal.toLocaleString()}
          </span>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-[#059669] text-white shadow-lg space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60 block">
            {t.todayGlobal}
          </span>
          <span className="text-3xl font-black tracking-tight block">
            {aggregateTodayTotal.toLocaleString()}
          </span>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-white border border-black/[0.04] text-[#124559] shadow-sm space-y-1">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#124559]/40 block">
            {t.activeReciters}
          </span>
          <span className="text-3xl font-black tracking-tight block">
            {users.length}
          </span>
        </div>
      </div>

      {/* Account Login / Setup Card if not authenticated */}
      {!activeUser && (
        <div className="w-full p-8 md:p-12 rounded-[3.5rem] bg-white border border-black/[0.04] shadow-xl space-y-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-[#124559]/5 rounded-3xl flex items-center justify-center mx-auto text-3xl">
            👥
          </div>

          <div className="space-y-3 max-w-md mx-auto">
            <h3 className="text-2xl font-black text-[#124559] tracking-tight">
              {t.loginPromptTitle}
            </h3>
            <p className="text-xs font-medium text-[#124559]/70 leading-relaxed">
              {t.loginPromptDesc}
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center space-x-4 bg-[#124559] text-white px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-[#064e3b] active:scale-95 transition-all shadow-xl shadow-[#124559]/20 disabled:opacity-50"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : t.signInBtn}</span>
            </button>
          </div>

          {/* Domain Error Notice & Step-by-Step Fix */}
          {domainError && (
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-left space-y-4 max-w-lg mx-auto">
              <div className="flex items-center space-x-3 text-amber-800 font-bold text-sm">
                <span>⚠️</span>
                <span>{t.domainErrorTitle}</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                {t.domainErrorDesc}
              </p>
              
              <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-800 truncate mr-2">
                  {currentDomain}
                </span>
                <button
                  onClick={copyDomainToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-amber-700 transition-colors shrink-0"
                >
                  {copied ? t.copied : t.copyDomain}
                </button>
              </div>

              <p className="text-[11px] font-medium text-amber-900/70">
                {t.domainInstructions}
              </p>

              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0696360944/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full text-center py-3 rounded-2xl bg-amber-700 text-white font-black text-[11px] uppercase tracking-widest hover:bg-amber-800 transition-colors"
              >
                {t.openConsole} ↗
              </a>
            </div>
          )}

          {/* Guest Name Fallback */}
          <div className="pt-6 border-t border-black/[0.04] max-w-sm mx-auto space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#124559]">{t.guestFallbackTitle}</h4>
              <p className="text-[11px] text-[#124559]/60">{t.guestFallbackDesc}</p>
            </div>
            <form onSubmit={handleCreateGuestProfile} className="flex space-x-2">
              <input 
                type="text" 
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder={t.enterName}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-black/10 text-xs font-bold text-[#124559] focus:outline-none focus:ring-2 focus:ring-[#059669]/30"
              />
              <button 
                type="submit"
                className="px-5 py-3 rounded-2xl bg-[#059669] text-white font-black text-[10px] uppercase tracking-wider hover:bg-[#047857] transition-colors"
              >
                {t.joinGuestBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Bar if authenticated or guest */}
      {activeUser && (
        <div className="p-6 rounded-[2.5rem] bg-white border border-black/[0.04] shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {activeUser.photoURL ? (
              <img 
                src={activeUser.photoURL} 
                alt={activeUser.displayName || 'User'} 
                className="w-12 h-12 rounded-full border-2 border-[#059669] object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#124559] text-white flex items-center justify-center font-black text-lg">
                {(activeUser.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="font-bold text-[#124559] text-base leading-tight">
                {activeUser.displayName || 'Reciter'}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#059669]">
                  {t.syncedBadge}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors"
          >
            {t.signOutBtn}
          </button>
        </div>
      )}

      {/* Reciters Directory */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <h3 className="text-xl font-black text-[#124559] tracking-tight">
            {t.reciterListTitle}
          </h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="px-5 py-3 rounded-2xl bg-white border border-black/[0.05] text-xs font-medium text-[#124559] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 w-full md:w-60"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-10 rounded-[2.5rem] bg-white border border-black/[0.04] text-center text-xs text-[#124559]/50">
            {t.noUsersFound}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u, idx) => {
              const isMe = activeUser ? u.uid === activeUser.uid : false;
              const appreciated = mashaallahCounts[u.uid] || 0;

              return (
                <div 
                  key={u.uid} 
                  className={`p-6 rounded-[2.5rem] bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isMe ? 'border-[#059669] ring-2 ring-[#059669]/10 shadow-md' : 'border-black/[0.03] shadow-sm hover:border-black/10'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-black text-[#124559]/30 w-6 text-center">
                      #{idx + 1}
                    </span>
                    {u.photoURL ? (
                      <img 
                        src={u.photoURL} 
                        alt={u.displayName} 
                        className="w-10 h-10 rounded-full object-cover border border-black/5"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#124559]/10 text-[#124559] flex items-center justify-center font-black text-sm">
                        {(u.displayName || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#124559] text-sm">
                          {u.displayName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-[#124559]/50 block">
                        Last active: {u.lastActiveDate || todayDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.03]">
                    <div className="text-right">
                      <span className="text-lg font-black text-[#059669] block leading-none">
                        {u.todayCount || 0}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#124559]/40">
                        {t.todayLabel}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-[#124559] block leading-none">
                        {u.totalCount || 0}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#124559]/40">
                        {t.totalLabel}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMashaAllahClick(u.uid)}
                      className="px-4 py-2 rounded-full bg-[#059669]/10 hover:bg-[#059669]/20 text-[#059669] font-black text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex items-center space-x-1"
                    >
                      <span>✨ {t.mashaAllah}</span>
                      {appreciated > 0 && <span className="bg-[#059669] text-white px-1.5 py-0.2 rounded-full text-[8px]">{appreciated}</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
