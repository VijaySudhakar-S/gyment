'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberApi } from '@/lib/api/member/member.api';
import {
  Dumbbell,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Calendar,
} from 'lucide-react';
import { App } from 'antd';

export default function MemberLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const clean = phone.trim();
    if (!clean) {
      message.warning('Please enter your registered phone number or Member ID');
      return;
    }

    try {
      setLoading(true);
      const res = await memberApi.login(clean);

      if (res.status && res.data) {
        message.success(`Welcome, ${res.data.member.firstName}!`);
        router.push('/member');
      } else {
        message.error(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || 'Member not found. Check with your gym reception.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1512] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl w-full mx-auto py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">Gyment</span>
            <span className="text-[11px] block font-semibold text-emerald-400 -mt-1 tracking-wider uppercase">
              Member Pass
            </span>
          </div>
        </div>

        <a
          href="/login"
          className="text-xs font-semibold text-stone-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-lg"
        >
          Staff & Admin Portal →
        </a>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 my-auto max-w-md w-full mx-auto py-8">
        <div className="bg-[#141C18]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Card Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
            Instant Member Check-in
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gym Member Portal
          </h1>
          <p className="text-stone-400 text-sm mt-1.5 leading-relaxed">
            Enter your registered phone number or Member ID to view your digital pass and mark attendance.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                Mobile Number or Member ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or MEM-001"
                  autoFocus
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#0B100E] border border-stone-800 rounded-xl text-white placeholder-stone-500 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Access Digital Pass
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Perks / Explanations */}
          <div className="mt-7 pt-6 border-t border-stone-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-stone-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero passwords or OTP delays — fast entrance lookup</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-stone-400">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Scan entrance QR code directly from your smartphone</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-stone-400">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time membership expiry & visit streak tracker</span>
            </div>
          </div>
        </div>

        {/* Footer Support hint */}
        <p className="text-center text-xs text-stone-500 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Protected by Gyment
        </p>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 text-center text-stone-600 text-xs py-2">
        © {new Date().getFullYear()} Gyment Fitness Systems. All rights reserved.
      </footer>
    </div>
  );
}
