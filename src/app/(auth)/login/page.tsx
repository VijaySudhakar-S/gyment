'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  Moon,
  Sun,
  ShieldAlert,
  Dumbbell,
  UserCheck,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { App } from 'antd';
import { motion } from 'framer-motion';
import { loginGymUser } from '@/lib/api/gymadmin/auth.api';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { useTheme } from '@/context/ThemeContext';
import { GymUserRole } from '@/types/auth';

export default function GymLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'GYMENT — Gym Staff Login';
  }, []);

  const [selectedRole, setSelectedRole] = useState<GymUserRole | 'ALL'>('ALL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const roles = [
    {
      id: 'ALL' as const,
      label: 'All Staff',
      desc: 'Gym staff portal',
      icon: Building2,
    },
    {
      id: 'GYM_ADMIN' as const,
      label: 'Gym Admin',
      desc: 'Owner / Manager',
      icon: Building2,
    },
    {
      id: 'RECEPTIONIST' as const,
      label: 'Receptionist',
      desc: 'Front Desk',
      icon: UserCheck,
    },
    {
      id: 'TRAINER' as const,
      label: 'Trainer',
      desc: 'Fitness Coach',
      icon: Dumbbell,
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      message.error('Please enter both email and password.');
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const data = await loginGymUser({
        email: cleanEmail,
        password,
        expectedRole: selectedRole !== 'ALL' ? selectedRole : undefined,
      });

      // Save tokens and user session
      tokenStorage.setSession({
        token: data.token,
        refreshToken: data.refreshtoken,
        user: data.user,
      });

      message.success(`Welcome back, ${data.user.name}!`);

      // Dynamic redirect based on role
      if (data.user.role === 'RECEPTIONIST') {
        router.push('/gym-admin/attendance');
      } else if (data.user.role === 'TRAINER') {
        router.push('/gym-admin/trainers');
      } else {
        router.push('/gym-admin');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid email or password.';
      setFormError(errMsg);
      message.error(errMsg);
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
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-primary font-extrabold text-[#0E1712] text-[22px] shadow-sm mb-3">
            G
          </div>
          <h1 className="text-[22px] font-extrabold text-gyment-text dark:text-white tracking-tight m-0">
            GYMENT
          </h1>
          <p className="text-xs font-semibold text-muted dark:text-stone-400 mt-1">
            Gym Management &amp; Staff Portal
          </p>
        </div>

        {/* Role selector pill */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 border border-border dark:border-stone-800 rounded-xl mb-4">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-white dark:bg-stone-800 text-gyment-text dark:text-white shadow-xs font-bold'
                    : 'text-muted dark:text-stone-400 hover:text-gyment-text dark:hover:text-stone-200 font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : ''}`} />
                <span className="text-[11px] truncate">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 border border-gyment-border dark:border-stone-800 rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(20,30,24,0.06)]">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gyment-text dark:text-white m-0">
              Sign In to Your Gym
            </h2>
            <p className="text-xs text-muted dark:text-stone-400 mt-1 m-0">
              {selectedRole === 'ALL'
                ? 'Sign in as Gym Admin, Receptionist, or Trainer.'
                : `Signing in as ${
                    roles.find((r) => r.id === selectedRole)?.label
                  }.`}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {formError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <span>{formError}</span>
                  {formError.toLowerCase().includes('super administrator') && (
                    <div className="mt-1.5">
                      <Link
                        href="/super-admin/login"
                        className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                      >
                        Go to Super Admin Console &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-gyment-text dark:text-stone-300 uppercase tracking-[0.4px] mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-gyment-muted dark:text-stone-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2 text-sm bg-gyment-bg dark:bg-stone-800/80 border border-gyment-border dark:border-stone-700 rounded-lg text-gyment-text dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-gyment-text dark:text-stone-300 uppercase tracking-[0.4px]"
                >
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-gyment-muted dark:text-stone-500 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9.5 pr-10 py-2 text-sm bg-gyment-bg dark:bg-stone-800/80 border border-gyment-border dark:border-stone-700 rounded-lg text-gyment-text dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
                  <span>
                    Sign In as{' '}
                    {selectedRole === 'ALL'
                      ? 'Gym Staff'
                      : roles.find((r) => r.id === selectedRole)?.label}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Super Admin Login */}
          <div className="mt-6 pt-5 border-t border-gyment-border dark:border-stone-800 text-center">
            <p className="text-xs text-muted dark:text-stone-400 m-0">
              Platform Super Administrator?{' '}
              <Link
                href="/super-admin/login"
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Super Admin Console
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
