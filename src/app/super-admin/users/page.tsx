'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, Users as UsersIcon } from 'lucide-react';
import { App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { User, UserRole, UserStatus } from '@/types/user';
import { initials } from '@/lib/formatters';

export default function UsersPage() {
  const { message } = App.useApp();
  const { users, gyms, openUserDrawer } = useSuperAdmin();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gymFilter, setGymFilter] = useState<string>('');

  const uniqueGymNames = useMemo(() => {
    return Array.from(new Set(gyms.map(g => g.name)));
  }, [gyms]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      const matchGym = !gymFilter || u.gym === gymFilter;

      return matchSearch && matchRole && matchStatus && matchGym;
    });
  }, [users, search, roleFilter, statusFilter, gymFilter]);

  const handleExport = () => {
    message.success('Users export prepared');
  };

  return (
    <>
      <Topbar
        title="Users"
        subtitle="View platform accounts across all gyms."
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="border border-[#E3E8E5] bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-[#232D27] flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* Filters */}
        <MotionFadeIn delay={0.04} className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gyment-border rounded-lg px-3 py-1.5 w-52.5 focus-within:border-primary">
            <Search className="w-4 h-4 text-gyment-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="bg-transparent border-none outline-none text-[12.5px] text-gyment-text placeholder-gyment-muted w-full"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          >
            <option value="">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Gym Owner">Gym Owner</option>
            <option value="Staff">Staff</option>
            <option value="Trainer">Trainer</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
          </select>

          <select
            value={gymFilter}
            onChange={e => setGymFilter(e.target.value)}
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          >
            <option value="">All Gyms</option>
            {uniqueGymNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </MotionFadeIn>

        {/* Users Table */}
        <MotionFadeIn delay={0.1} className="bg-white border border-gyment-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    User
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Email
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Role
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Gym
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Last Login
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-3 py-2.5 border-b border-gyment-border"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gyment-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gyment-muted">
                      <div className="flex flex-col items-center">
                        <UsersIcon className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                        <div className="font-bold text-sm text-gyment-text mb-1">
                          No users found
                        </div>
                        <div className="text-xs">
                          Try adjusting your filters or search query.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gyment-bg transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
                            {initials(user.name)}
                          </div>
                          <div className="font-bold text-gyment-text">{user.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{user.email}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{user.role}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{user.gym}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{user.lastLogin}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{user.created}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openUserDrawer(user.id)}
                          className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
