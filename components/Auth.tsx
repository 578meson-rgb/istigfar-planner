import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  language: 'en' | 'bn';
}

const Auth: React.FC<AuthProps> = ({ language }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const t = {
    en: {
      title: "Welcome Back",
      subtitle: "Sign in to your spiritual journey",
      email: "Email Address",
      password: "Password",
      login: "Login",
      signup: "Create Account",
      google: "Continue with Google",
      or: "or use email",
      toggleLogin: "Already have an account? Login",
      toggleSignup: "New here? Create an account",
      success: "Success! Check your email to verify your account.",
    },
    bn: {
      title: "স্বাগতম",
      subtitle: "আপনার আধ্যাত্মিক যাত্রায় প্রবেশ করুন",
      email: "ইমেইল ঠিকানা",
      password: "পাসওয়ার্ড",
      login: "লগইন করুন",
      signup: "অ্যাকাউন্ট তৈরি করুন",
      google: "গুগল দিয়ে প্রবেশ করুন",
      or: "অথবা ইমেইল ব্যবহার করুন",
      toggleLogin: "আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন",
      toggleSignup: "নতুন? একটি অ্যাকাউন্ট তৈরি করুন",
      success: "সফল হয়েছে! আপনার ইমেল যাচাই করুন।",
    }
  }[language];

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const redirectTo = window.location.origin;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: redirectTo,
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: t.success });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf9f6]">
      <div className="w-full max-w-md p-10 bg-white rounded-[3.5rem] shadow-2xl border border-black/[0.03] space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black font-outfit text-[#124559]">{isSignUp ? t.signup : t.title}</h2>
          <p className="text-sm font-medium opacity-40 font-outfit">{t.subtitle}</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-center space-x-3 hover:bg-black/[0.02] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-bold text-[#124559]">{t.google}</span>
          </button>

          <div className="flex items-center space-x-4 py-2">
            <div className="flex-1 h-px bg-black/[0.05]"></div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-20">{t.or}</span>
            <div className="flex-1 h-px bg-black/[0.05]"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-2">{t.email}</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#124559]/5 border-none focus:ring-2 focus:ring-[#10b981] transition-all font-outfit"
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-2">{t.password}</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#124559]/5 border-none focus:ring-2 focus:ring-[#10b981] transition-all font-outfit"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`text-[11px] font-bold text-center p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message.text}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-[#124559] hover:bg-[#059669] transition-all disabled:opacity-50 shadow-lg shadow-[#124559]/10 active:scale-[0.98]"
            >
              {loading ? '...' : (isSignUp ? t.signup : t.login)}
            </button>
          </form>
        </div>

        <button 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage(null);
          }}
          className="w-full text-[11px] font-bold uppercase tracking-widest text-[#124559] opacity-40 hover:opacity-100 transition-all"
        >
          {isSignUp ? t.toggleLogin : t.toggleSignup}
        </button>
      </div>
    </div>
  );
};

export default Auth;