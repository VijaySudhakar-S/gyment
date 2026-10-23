'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Moon, Sun, Shield } from 'lucide-react';
import { App } from 'antd';
import { motion } from 'framer-motion';
import { loginSuperAdmin } from '@/lib/api/superadmin/auth.api';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { useTheme } from '@/context/ThemeContext';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'GYMENT — Super Admin Login';
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      message.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginSuperAdmin({
        email: cleanEmail,
        password,
      });

      // Save tokens and user session via centralized storage utility
      tokenStorage.setSession({
        token: data.token,
        refreshToken: data.refreshtoken,
        user: data.user,
      });

      message.success(`Welcome back, ${data.user.name || 'SuperAdmin'}!`);
      router.push('/super-admin');
    } catch (err: any) {
      message.error(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gyment-bg dark:bg-black flex flex-col justify-center items-center p-4 relative transition-colors">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg border border-gyment-border dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-gyment-bg dark:hover:bg-stone-800 flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs"
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 stroke-2" />
          ) : (
            <Moon className="w-4 h-4 text-gyment-text stroke-2" />
          )}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-105"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-primary font-extrabold text-[#0E1712] text-[22px] shadow-sm mb-3">
            G
          </div>
          <h1 className="text-[22px] font-extrabold text-gyment-text dark:text-white tracking-tight m-0">
            GYMENT
          </h1>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-wider">
            <Shield className="w-3 h-3" />
            Super Admin Portal
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 border border-gyment-border dark:border-stone-800 rounded-2xl p-7 shadow-[0_4px_24px_rgba(20,30,24,0.06)]">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gyment-text dark:text-white m-0">
              Super Admin Sign In
            </h2>
            <p className="text-[12.5px] text-gyment-muted dark:text-stone-400 mt-1 m-0">
              Access the GYMENT platform administrative console.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-gyment-text dark:text-stone-300 uppercase tracking-[0.4px] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-gyment-muted dark:text-stone-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@gyment.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 text-sm bg-gyment-bg dark:bg-stone-800/80 border border-gyment-border dark:border-stone-700 rounded-lg text-gyment-text dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gyment-text dark:text-stone-300 uppercase tracking-[0.4px] mb-1.5"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-gyment-muted dark:text-stone-500 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 text-sm bg-gyment-bg dark:bg-stone-800/80 border border-gyment-border dark:border-stone-700 rounded-lg text-gyment-text dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Gym Portal Login */}
          <div className="mt-6 pt-5 border-t border-gyment-border dark:border-stone-800 text-center">
            <p className="text-xs text-muted dark:text-stone-400 m-0">
              Gym Owner, Receptionist, or Trainer?{' '}
              <Link
                href="/login"
                className="font-bold text-primary hover:text-primary-dark underline cursor-pointer"
              >
                Gym Portal Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
