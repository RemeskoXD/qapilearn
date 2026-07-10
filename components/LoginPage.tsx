import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Award,
  Calendar,
  Gem,
  CheckSquare
} from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';

const MotionDiv = motion.div as any;

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = '/auth/login';
      const payload = { email, password };
      const res = await api.post<{ user: User }>(endpoint, payload);
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || 'Něco se pokazilo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* LEVÁ STRANA – branding (skrytá na mobilu) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-white via-slate-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col items-start gap-1">
            <img 
              src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" 
              alt="Q-Hub Logo" 
              className="h-16 w-auto object-contain"
            />
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">Interní vzdělávací systém</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Materiál pro stažení, růst a odměny <span className="text-indigo-600">na jednom místě.</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-10">
            Q-Hub je interní gamifikační platforma pro tým. Materiál pro stažení, odměny, události
            a sledování pokroku — vše v jedné aplikaci.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Feature icon={<Award size={18} />} label="Gamifikace & Levely" />
            <Feature icon={<Calendar size={18} />} label="Akce & Webináře" />
            <Feature icon={<Gem size={18} />} label="QAPI Coin & Odměny" />
            <Feature icon={<CheckSquare size={18} />} label="Bonusové úkoly" />
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} Q-Hub. Powered by PostgreSQL.
        </div>
      </div>

      {/* PRAVÁ STRANA – formulář */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo na mobilu */}
          <div className="flex flex-col items-center text-center gap-1 mb-10 lg:hidden">
            <img 
              src="https://web2.itnahodinu.cz/QAPI/QHUB.jpeg" 
              alt="Q-Hub Logo" 
              className="h-14 w-auto object-contain"
            />
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">Interní vzdělávací systém</p>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Přihlášení
          </h2>
          <p className="text-slate-500 mb-8">
            Zadej email a heslo pro vstup do Q-Hub.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ty@firma.cz"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">
                Heslo
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Přihlásit se
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <a
              href="#db-check"
              onClick={() => {
                window.location.hash = '#db-check';
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 font-medium transition"
            >
              🏥 Databázová diagnostika & Seeder
            </a>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

const Feature: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2.5">
    <span className="text-indigo-600">{icon}</span>
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </div>
);

export default LoginPage;
