import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeToCommunityUsers, 
  UserProfile, 
  syncUserDataToFirestore,
  clearAllCommunityDataFromFirestore
} from '../lib/firebase';
import { Language } from '../types';

interface CommunityProps {
  reciterProfile: { uid: string; displayName: string } | null;
  onSetReciterProfile: (profile: { uid: string; displayName: string } | null) => void;
  language: Language;
  todayCount: number;
  totalCount: number;
  todayDate: string;
}

const communityTranslations = {
  en: {
    title: "Community Database",
    subtitle: "Connect with reciters worldwide and view global Istighfar progress in real-time.",
    joinTitle: "Join Live Community Database",
    joinDesc: "Enter your name to feature your recitations in the global database. No passwords required!",
    enterName: "Enter your reciter name (e.g. Adnan)",
    joinBtn: "Join Community",
    profileTitle: "Your Reciter Profile",
    changeName: "Edit Name",
    leaveCommunity: "Disconnect Profile",
    globalTotal: "Global Istighfars",
    todayGlobal: "Today's Global Total",
    activeReciters: "Active Reciters",
    reciterListTitle: "Top Reciters & Community Members",
    searchPlaceholder: "Search reciter by name...",
    mashaAllah: "MashaAllah",
    syncedBadge: "Live Database Synced",
    noUsersFound: "No reciters found in database.",
    todayLabel: "Today",
    totalLabel: "Total",
    resetDbBtn: "Clear Database & Start Fresh",
    confirmReset: "Are you sure you want to delete all entries and reset the community database to zero?"
  },
  bn: {
    title: "কমিউনিটি ডাটাবেস",
    subtitle: "বিশ্বজুড়ে অন্যান্য রেসিটারদের সাথে যুক্ত হন এবং রিয়েল-টাইমে গ্লোবাল ইস্তিগফার দেখুন।",
    joinTitle: "লাইভ কমিউনিটি ডাটাবেসে যোগ দিন",
    joinDesc: "গ্লোবাল ডাটাবেসে আপনার জিকির যুক্ত করতে নাম লিখুন। কোনো পাসওয়ার্ডের প্রয়োজন নেই!",
    enterName: "আপনার নাম লিখুন (যেমন: আদনান)",
    joinBtn: "কমিউনিটিতে যোগ দিন",
    profileTitle: "আপনার প্রোফাইল",
    changeName: "নাম পরিবর্তন",
    leaveCommunity: "প্রোফাইল সরান",
    globalTotal: "সর্বমোট গ্লোবাল ইস্তিগফার",
    todayGlobal: "আজকের গ্লোবাল মোট",
    activeReciters: "সক্রিয় সদস্য",
    reciterListTitle: "শীর্ষ রেসিটার এবং কমিউনিটি সদস্যবৃন্দ",
    searchPlaceholder: "নাম দিয়ে সদস্য খুঁজুন...",
    mashaAllah: "মাশাআল্লাহ",
    syncedBadge: "লাইভ ডাটাবেস সিঙ্কড",
    noUsersFound: "কোন সদস্য পাওয়া যায়নি।",
    todayLabel: "আজ",
    totalLabel: "মোট",
    resetDbBtn: "ডাটাবেস সম্পূর্ণ রিসেট করুন",
    confirmReset: "আপনি কি নিশ্চিত যে সকল পুরাতন এন্ট্রি মুছে ফেলে ডাটাবেস নতুন করে শুরু করতে চান?"
  }
};

const Community: React.FC<CommunityProps> = ({
  reciterProfile,
  onSetReciterProfile,
  language,
  todayCount,
  totalCount,
  todayDate
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [mashaallahCounts, setMashaallahCounts] = useState<{ [uid: string]: number }>({});

  const t = communityTranslations[language];

  // Subscribe to live community users snapshot from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCommunityUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });
    return () => unsubscribe();
  }, []);

  // Sync active user profile & count to Firestore
  useEffect(() => {
    if (reciterProfile) {
      syncUserDataToFirestore(reciterProfile, todayCount, totalCount, todayDate);
    }
  }, [reciterProfile, todayCount, totalCount, todayDate]);

  // Helper function to create deterministic ID from name to prevent duplicate rows for the same user
  const createDeterministicUid = (name: string) => {
    const clean = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
    if (clean.length > 0) {
      return `reciter_${clean}`;
    }
    // Fallback for non-ASCII (e.g. Bangla characters)
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return `reciter_bn_${Math.abs(hash)}`;
  };

  const handleJoinCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const deterministicUid = createDeterministicUid(nameInput);
    const newProfile = {
      uid: deterministicUid,
      displayName: nameInput.trim()
    };

    onSetReciterProfile(newProfile);
    setIsEditingName(false);
    setNameInput('');
    syncUserDataToFirestore(newProfile, todayCount, totalCount, todayDate);
  };

  const handleResetDatabase = async () => {
    if (window.confirm(t.confirmReset)) {
      setIsClearing(true);
      await clearAllCommunityDataFromFirestore();
      setUsers([]);
      if (reciterProfile) {
        await syncUserDataToFirestore(reciterProfile, todayCount, totalCount, todayDate);
      }
      setIsClearing(false);
    }
  };

  const handleMashaAllahClick = (uid: string) => {
    setMashaallahCounts(prev => ({
      ...prev,
      [uid]: (prev[uid] || 0) + 1
    }));
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  // Deduplicate users by clean lowercase display name or UID so duplicate legacy rows never show up
  const deduplicatedUsers = useMemo(() => {
    const uniqueUsersMap = new Map<string, UserProfile>();
    users.forEach(u => {
      const key = (u.displayName || '').trim().toLowerCase();
      if (!key) return;
      const existing = uniqueUsersMap.get(key);
      const isCurrentActive = reciterProfile && u.uid === reciterProfile.uid;
      if (!existing || isCurrentActive || (u.totalCount || 0) > (existing.totalCount || 0)) {
        uniqueUsersMap.set(key, u);
      }
    });
    return Array.from(uniqueUsersMap.values()).sort((a, b) => (b.totalCount || 0) - (a.totalCount || 0));
  }, [users, reciterProfile]);

  // Compute aggregate stats from real-time Firestore database
  const aggregateGlobalTotal = useMemo(() => deduplicatedUsers.reduce((acc, u) => acc + (u.totalCount || 0), 0), [deduplicatedUsers]);
  const aggregateTodayTotal = useMemo(() => deduplicatedUsers.reduce((acc, u) => acc + (u.todayCount || 0), 0), [deduplicatedUsers]);

  const filteredUsers = useMemo(() => deduplicatedUsers.filter(u => 
    (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  ), [deduplicatedUsers, searchQuery]);

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
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
            {deduplicatedUsers.length}
          </span>
        </div>
      </div>

      {/* Profile / Join Card */}
      {!reciterProfile || isEditingName ? (
        <div className="p-8 md:p-10 rounded-[3rem] bg-white border border-black/[0.04] shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 bg-[#059669]/10 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            ✨
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-black text-[#124559] tracking-tight">
              {t.joinTitle}
            </h3>
            <p className="text-xs font-medium text-[#124559]/70 leading-relaxed">
              {t.joinDesc}
            </p>
          </div>

          <form onSubmit={handleJoinCommunity} className="max-w-md mx-auto space-y-3">
            <input 
              type="text" 
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={reciterProfile?.displayName || t.enterName}
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-black/10 text-sm font-bold text-[#124559] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 text-center"
            />
            <div className="flex space-x-3">
              {isEditingName && (
                <button 
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-[#124559] font-black text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-[#059669] text-white font-black text-xs uppercase tracking-widest hover:bg-[#047857] transition-all shadow-lg shadow-[#059669]/20"
              >
                {t.joinBtn}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Joined Profile Active Bar */
        <div className="p-6 rounded-[2.5rem] bg-white border border-[#059669]/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#124559] text-white flex items-center justify-center font-black text-lg">
              {reciterProfile.displayName[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-[#124559] text-base leading-tight">
                  {reciterProfile.displayName}
                </h4>
                <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#059669]/10 text-[#059669]">
                  You
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#059669]">
                  {t.syncedBadge}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setNameInput(reciterProfile.displayName);
                setIsEditingName(true);
              }}
              className="px-4 py-2 rounded-full bg-[#124559]/5 hover:bg-[#124559]/10 text-[#124559] font-bold text-xs transition-colors"
            >
              ✏️ {t.changeName}
            </button>
            <button 
              onClick={() => onSetReciterProfile(null)}
              className="px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors"
            >
              {t.leaveCommunity}
            </button>
          </div>
        </div>
      )}

      {/* Reciters Directory */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <h3 className="text-xl font-black text-[#124559] tracking-tight">
            {t.reciterListTitle}
          </h3>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="px-5 py-3 rounded-2xl bg-white border border-black/[0.05] text-xs font-medium text-[#124559] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 flex-1 md:w-60"
            />
            <button
              onClick={handleResetDatabase}
              disabled={isClearing}
              title="Clear all old database entries to start fresh"
              className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-bold text-[11px] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
            >
              🧹 {isClearing ? 'Clearing...' : t.resetDbBtn}
            </button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-10 rounded-[2.5rem] bg-white border border-black/[0.04] text-center text-xs text-[#124559]/50">
            {t.noUsersFound}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u, idx) => {
              const isMe = reciterProfile ? u.uid === reciterProfile.uid : false;
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
                    <div className="w-10 h-10 rounded-full bg-[#124559]/10 text-[#124559] flex items-center justify-center font-black text-sm">
                      {(u.displayName || 'U')[0].toUpperCase()}
                    </div>
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
