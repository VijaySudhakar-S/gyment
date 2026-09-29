'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { App } from 'antd';
import { motion } from 'framer-motion';
import { loginSuperAdmin } from '@/lib/api/superadmin/auth.api';
import { tokenStorage } from '@/lib/auth/tokenStorage';

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();

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
    <div className="min-h-screen bg-gyment-bg flex flex-col justify-center items-center p-4">
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
          <h1 className="text-[22px] font-extrabold text-gyment-text tracking-tight m-0">
            GYMENT
          </h1>
          <div className="text-[11px] font-bold text-gyment-muted tracking-[0.8px] uppercase mt-0.5">
            Super Admin Portal
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gyment-border rounded-xl p-7 shadow-[0_4px_24px_rgba(20,30,24,0.06)]">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gyment-text m-0">Sign In</h2>
            <p className="text-[12.5px] text-gyment-muted mt-1 m-0">
              Access the GYMENT platform administrative console.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gyment-text">
                Admin Email
              </label>
              <div className="flex items-center gap-2 border border-gyment-border rounded-[9px] px-3 py-2 bg-white focus-within:border-primary transition-colors">
                <Mail className="w-4 h-4 text-gyment-muted shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@gyment.app"
                  required
                  autoComplete="email"
                  className="bg-transparent border-none outline-none text-[13px] text-gyment-text w-full placeholder-gyment-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-bold text-gyment-text">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => message.info('Password reset is available via the administrator account service.')}
                  className="text-[11.5px] font-semibold text-primary-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center gap-2 border border-gyment-border rounded-[9px] px-3 py-2 bg-white focus-within:border-primary transition-colors">
                <Lock className="w-4 h-4 text-gyment-muted shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-transparent border-none outline-none text-[13px] text-gyment-text w-full placeholder-gyment-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark font-semibold text-[13.5px] py-2.5 rounded-[9px] flex items-center justify-center gap-2 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating…' : 'Sign In to Super Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[12px] text-gyment-muted">
          &copy; {new Date().getFullYear()} GYMENT Inc. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
