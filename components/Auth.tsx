
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  language: 'en' | 'bn';
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ language, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const t = {
    en: {
      title: "Spiritual Access",
      subtitle: "Sign in to synchronize your journey",
      email: "Email Address",
      password: "Password",
      login: "Enter Sanctuary",
      signup: "Begin New Path",
      google: "Sign in with Google",
      or: "or connect manually",
      toggleLogin: "Already on a path? Login",
      toggleSignup: "New traveler? Create account",
      success: "A verification breath has been sent to your email.",
      back: "Home",
      errorPrefix: "Connection Error: "
    },
    bn: {
      title: "অ্যাপে প্রবেশ",
      subtitle: "আপনার যাত্রা সিঙ্ক করতে সাইন ইন করুন",
      email: "ইমেইল ঠিকানা",
      password: "পাসওয়ার্ড",
      login: "প্রবেশ করুন",
      signup: "নতুন যাত্রা শুরু করুন",
      google: "গুগল দিয়ে প্রবেশ করুন",
      or: "অথবা ইমেইল ব্যবহার করুন",
      toggleLogin: "আগে থেকেই অ্যাকাউন্ট আছে? লগইন",
      toggleSignup: "নতুন? একটি অ্যাকাউন্ট তৈরি করুন",
      success: "একটি যাচাইকরণ ইমেল পাঠানো হয়েছে।",
      back: "হোমে ফিরে যান",
      errorPrefix: "ত্রুটি: "
    }
  }[language];

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    
    // Clean origin definition
    const redirectTo = window.location.origin.replace(/\/$/, '');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      });

      if (error) {
        setMessage({ type: 'error', text: t.errorPrefix + error.message });
        setLoading(false);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: t.errorPrefix + "Check your connection" });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: t.success });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: t.errorPrefix + (error.message || "Something went wrong") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf9f6]">
      <div className="w-full max-w-md p-10 md:p-14 bg-white rounded-[4rem] shadow-2xl border border-black/[0.03] space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <h2 className="text-4xl font-black font-outfit text-[#124559] tracking-tighter">{isSignUp ? t.signup : t.title}</h2>
            <p className="text-sm font-medium opacity-40 font-outfit leading-relaxed">{t.subtitle}</p>
          </div>
          {onBack && (
            <button onClick={onBack} className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-xs hover:bg-black/10 transition-colors">✕</button>
          )}
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group w-full py-5 rounded-[2rem] bg-white border border-black/[0.08] shadow-sm flex items-center justify-center space-x-4 hover:bg-black/[0.02] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-black text-[#124559] tracking-wider">{t.google}</span>
          </button>

          <div className="flex items-center space-x-4 py-2">
            <div className="flex-1 h-px bg-black/[0.05]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-20">{t.or}</span>
            <div className="flex-1 h-px bg-black/[0.05]"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-4">{t.email}</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-5 rounded-3xl bg-[#124559]/5 border-none focus:ring-2 focus:ring-[#059669] transition-all font-outfit"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-4">{t.password}</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-5 rounded-3xl bg-[#124559]/5 border-none focus:ring-2 focus:ring-[#059669] transition-all font-outfit"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`text-[11px] font-bold text-center p-5 rounded-3xl animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#059669]/5 text-[#059669]'}`}>
                {message.text}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] text-white bg-[#124559] hover:bg-[#059669] transition-all disabled:opacity-50 shadow-xl shadow-[#124559]/20 active:scale-[0.98]"
            >
              {loading ? '...' : (isSignUp ? t.signup : t.login)}
            </button>
          </form>
        </div>

        <div className="flex flex-col space-y-5 pt-8 border-t border-black/[0.03]">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="w-full text-[11px] font-black uppercase tracking-widest text-[#124559] opacity-40 hover:opacity-100 transition-all"
          >
            {isSignUp ? t.toggleLogin : t.toggleSignup}
          </button>
          {onBack && (
            <button 
              onClick={onBack}
              className="w-full text-[10px] font-black uppercase tracking-widest text-[#124559] opacity-20 hover:opacity-50 transition-all"
            >
              ← {t.back}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
