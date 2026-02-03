
import React from 'react';

interface LandingProps {
  language: 'en' | 'bn';
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ language, onGetStarted }) => {
  const t = {
    en: {
      title: "Istighfar Tracker",
      subtitle: "Find peace in every breath",
      description: "A digital companion designed to cultivate mindfulness and spiritual consistency. Track your Istighfar counts, set personal milestones, and receive daily spiritual nourishment.",
      cta: "Begin Your Journey",
      feature1: "Daily Reflections",
      feature2: "Progress Insights",
      feature3: "Planned Milestones",
      footer: "Made with devotion by Adnan Khan"
    },
    bn: {
      title: "ইস্তিগফার ট্র্যাকার",
      subtitle: "প্রতিটি নিশ্বাসে শান্তি খুঁজুন",
      description: "সচেতনতা এবং আধ্যাত্মিক ধারাবাহিকতা বৃদ্ধির জন্য ডিজাইন করা একটি ডিজিটাল সঙ্গী। আপনার ইস্তিগফার গণনা ট্র্যাক করুন, ব্যক্তিগত মাইলফলক সেট করুন এবং প্রতিদিনের আধ্যাত্মিক প্রেরণা পান।",
      cta: "আপনার যাত্রা শুরু করুন",
      feature1: "দৈনিক প্রতিফলন",
      feature2: "অগ্রগতি পরিসংখ্যান",
      feature3: "পরিকল্পিত মাইলফলক",
      footer: "আদনান খান দ্বারা নিষ্ঠার সাথে তৈরি"
    }
  }[language];

  return (
    <div className="min-h-screen bg-[#faf9f6] overflow-hidden selection:bg-[#124559]/10 selection:text-[#124559]">
      {/* Decorative Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7af0bb]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#598392]/10 blur-[150px] rounded-full pointer-events-none"></div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-10 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#124559]"></div>
          <span className="text-sm font-black tracking-widest uppercase text-[#124559]">{t.title}</span>
        </div>
      </nav>

      <main className="relative z-10 pt-44 pb-20 px-8 flex flex-col items-center text-center max-w-4xl mx-auto">
        <div className="space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#059669] opacity-70 block">{t.subtitle}</span>
          <h1 className="text-6xl md:text-8xl font-black font-outfit text-[#124559] tracking-tighter leading-[0.9]">
            Reconnect <br />
            <span className="text-[#059669]">Spiritually.</span>
          </h1>
        </div>

        <p className="max-w-xl text-lg md:text-xl font-medium text-[#124559]/60 leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          {t.description}
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
          <button 
            onClick={onGetStarted}
            className="group relative px-12 py-6 rounded-full bg-[#124559] text-white overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[#124559]/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#059669] to-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 text-sm font-black uppercase tracking-widest">{t.cta}</span>
          </button>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
          {[t.feature1, t.feature2, t.feature3].map((f, i) => (
            <div key={i} className="p-8 rounded-[3rem] bg-white border border-black/[0.03] shadow-sm flex flex-col items-center space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#124559]/5 flex items-center justify-center text-[#124559] font-black italic">
                {i + 1}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#124559] opacity-60">{f}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-20 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest">{t.footer}</p>
      </footer>
    </div>
  );
};

export default Landing;
