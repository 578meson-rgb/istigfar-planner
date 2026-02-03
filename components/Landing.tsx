
import React from 'react';

interface LandingProps {
  language: 'en' | 'bn';
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ language, onGetStarted }) => {
  const t = {
    en: {
      title: "Istighfar Tracker",
      subtitle: "The Art of Spiritual Cleansing",
      hero: "Purify Your",
      heroAccent: "Heart.",
      description: "A sanctuary for the soul. Track your daily Istighfar, engage with AI-curated reflections, and find peace in the rhythm of remembrance.",
      cta: "Begin Your Path",
      pillars: "Spiritual Pillars",
      f1: "Consistency",
      f1d: "Build a lasting habit of daily remembrance.",
      f2: "Reflection",
      f2d: "Receive deep spiritual insights every 24 hours.",
      f3: "Privacy",
      f3d: "Your journey is yours alone, securely synced.",
      footer: "Curated with sincerity by Adnan Khan"
    },
    bn: {
      title: "ইস্তিগফার ট্র্যাকার",
      subtitle: "আধ্যাত্মিক শুদ্ধিকরণের শিল্প",
      hero: "হৃদয়কে",
      heroAccent: "শুদ্ধ করুন।",
      description: "আত্মার জন্য একটি অভয়ারণ্য। আপনার প্রতিদিনের ইস্তিগফার ট্র্যাক করুন, এআই-নির্দেশিত প্রতিফলনের সাথে যুক্ত হন এবং জিকিরের ছন্দে শান্তি খুঁজুন।",
      cta: "আপনার পথ শুরু করুন",
      pillars: "আধ্যাত্মিক স্তম্ভ",
      f1: "ধারাবাহিকতা",
      f1d: "দৈনিক জিকিরের একটি স্থায়ী অভ্যাস গড়ে তুলুন।",
      f2: "প্রতিফলন",
      f2d: "প্রতি ২৪ ঘণ্টায় গভীর আধ্যাত্মিক অন্তর্দৃষ্টি পান।",
      f3: "গোপনীয়তা",
      f3d: "আপনার যাত্রা একান্তই আপনার, নিরাপদে সংরক্ষিত।",
      footer: "আদনান খান দ্বারা নিষ্ঠার সাথে তৈরি"
    }
  }[language];

  return (
    <div className="min-h-screen bg-[#faf9f6] selection:bg-[#059669]/10 selection:text-[#059669] overflow-hidden">
      {/* Abstract Background Layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#7af0bb]/5 blur-[120px] rounded-full animate-pulse opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#124559]/5 blur-[150px] rounded-full animate-pulse opacity-40" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-[#aec3b0]/10 blur-[100px] rounded-full"></div>
      </div>

      <nav className="relative z-20 px-8 md:px-16 py-12 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 rounded-full bg-[#059669] shadow-lg shadow-[#059669]/20"></div>
          <span className="text-[11px] font-black tracking-[0.4em] uppercase text-[#124559] opacity-80">{t.title}</span>
        </div>
      </nav>

      <main className="relative z-10 pt-16 md:pt-24 pb-32 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-12 text-left">
            <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-1000">
              <span className="inline-block px-5 py-2 rounded-full bg-white border border-black/[0.03] text-[10px] font-black uppercase tracking-[0.3em] text-[#059669] shadow-sm">
                {t.subtitle}
              </span>
              <h1 className="text-7xl md:text-[9rem] font-black font-outfit text-[#124559] tracking-tighter leading-[0.8] py-2">
                {t.hero}<br />
                <span className="text-[#059669]">{t.heroAccent}</span>
              </h1>
            </div>

            <p className="max-w-xl text-xl md:text-2xl font-medium text-[#124559]/50 leading-relaxed animate-in fade-in slide-in-from-left-10 duration-1000 delay-200">
              {t.description}
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
              <button 
                onClick={onGetStarted}
                className="group relative px-16 py-8 rounded-full bg-[#124559] text-white overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[#124559]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#059669] to-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em]">{t.cta}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
            <div className="p-2 rounded-[4rem] bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl">
              <div className="p-10 rounded-[3.5rem] bg-white shadow-sm space-y-10">
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#059669] opacity-50">{t.pillars}</h3>
                  <div className="w-10 h-1 bg-[#059669]/10 rounded-full"></div>
                </div>
                
                <div className="space-y-8">
                  {[
                    { t: t.f1, d: t.f1d, icon: "✦" },
                    { t: t.f2, d: t.f2d, icon: "◈" },
                    { t: t.f3, d: t.f3d, icon: "◉" }
                  ].map((f, i) => (
                    <div key={i} className="flex items-start space-x-6">
                      <div className="w-10 h-10 rounded-2xl bg-[#124559]/5 flex items-center justify-center text-[#124559] font-black text-sm">
                        {f.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-[#124559] uppercase tracking-wider">{f.t}</h4>
                        <p className="text-xs font-medium text-[#124559]/40 leading-relaxed">{f.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-16 text-center border-t border-black/[0.02]">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#124559] opacity-20">{t.footer}</p>
      </footer>
    </div>
  );
};

export default Landing;
