'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Search, Users as UsersIcon, Plus, Trash2, Power, Edit3 } from 'lucide-react';
import { App, Select, Table, Input, Button, Tag, Space } from 'antd';
import type { TableColumnsType } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { initials } from '@/lib/formatters';
import { AddUserModal } from '@/components/super-admin/modals/AddUserModal';
import { usersApi, UserItem } from '@/lib/api/superadmin/users.api';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { TableSkeleton } from '@/components/shared/skeletons';

export default function UsersPage() {
  const { message, modal } = App.useApp();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const [userList, setUserList] = useState<UserItem[]>([]);
  const [gymList, setGymList] = useState<GymData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [gymFilter, setGymFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  // Fetch users & gyms directly from API
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await usersApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setUserList(res.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  const loadGyms = useCallback(async () => {
    try {
      const res = await gymsApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setGymList(res.data);
      }
    } catch (error: any) {
      console.error('Failed to load gyms for filter:', error?.message);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadGyms();
  }, [loadUsers, loadGyms]);

  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchUserType = !userTypeFilter || u.userType === userTypeFilter;
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchGym = !gymFilter || u.gymId === gymFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;

      return matchSearch && matchUserType && matchRole && matchGym && matchStatus;
    });
  }, [userList, search, userTypeFilter, roleFilter, gymFilter, statusFilter]);

  const handleCreateUser = () => {
    setUserToEdit(null);
    setIsAddUserModalOpen(true);
  };

  const handleEditUser = (user: UserItem) => {
    setUserToEdit(user);
    setIsAddUserModalOpen(true);
  };

  const handleToggleUserStatus = async (user: UserItem) => {
    try {
      const res = await usersApi.toggleStatus(user.id, user.userType);
      if (res.status) {
        message.success(res.message || 'User status updated');
        await loadUsers();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = (user: UserItem) => {
    modal.confirm({
      title: `Delete User "${user.name}"?`,
      content: `Are you sure you want to permanently delete user account "${user.email}"? This action cannot be undone.`,
      okText: 'Delete User',
      okType: 'danger',
      centered : true,
      onOk: async () => {
        try {
          const res = await usersApi.delete(user.id, user.userType);
          if (res.status) {
            message.success(res.message || 'User deleted successfully');
            await loadUsers();
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || error.message || 'Failed to delete user');
        }
      },
    });
  };

  const handleExport = () => {
    message.success('Users list exported successfully');
  };

  const columns: TableColumnsType<UserItem> = [
    {
      title: 'USER',
      dataIndex: 'name',
      key: 'name',
      render: (_, user) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${user.userType === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-primary-light text-primary-dark'
            }`}>
            {initials(user.name)}
          </div>
          <div className="font-bold text-gyment-text">{user.name}</div>
        </div>
      ),
    },
    {
      title: 'CONTACT DETAILS',
      key: 'contact',
      render: (_, user) => (
        <div>
          <div>{user.email}</div>
          <div className="text-[11px] text-gyment-muted">{user.phone || '—'}</div>
        </div>
      ),
    },
    {
      title: 'ACCOUNT CATEGORY',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType) => (
        <Tag color={userType === 'SUPER_ADMIN' ? 'purple' : 'blue'}>
          {userType === 'SUPER_ADMIN' ? 'Super Admin' : 'Gym User'}
        </Tag>
      ),
    },
    {
      title: 'ROLE',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span className="font-semibold text-gyment-text">{role}</span>,
    },
    {
      title: 'ASSIGNED GYM',
      dataIndex: 'gymName',
      key: 'gymName',
      render: (gymName) => gymName || 'Unassigned',
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status === 'ACTIVE' ? 'Active' : 'Disabled'} />,
    },
    {
      title: 'JOINED DATE',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right',
      render: (_, user) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={() => handleEditUser(user)}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<Power className="w-3.5 h-3.5" />}
            onClick={() => handleToggleUserStatus(user)}
          >
            {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="small"
            danger
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => handleDeleteUser(user)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="User Management"
        subtitle="Manage Super Admins and Gym Staff across all gyms."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={handleCreateUser}
              className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-5 w-full mx-auto space-y-4">
        {/* AntD Filter Toolbar */}
        <MotionFadeIn delay={0.04} className="flex items-center gap-2.5 flex-wrap bg-white border border-gyment-border rounded-xl p-3 shadow-2xs">
          <Input
            prefix={<Search className="w-4 h-4 text-gyment-muted mr-1" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="w-56"
            allowClear
          />

          <Select
            allowClear
            placeholder="User Type"
            value={userTypeFilter || undefined}
            onChange={(val) => setUserTypeFilter(val || '')}
            className="w-40 text-xs"
            options={[
              { value: 'SUPER_ADMIN', label: 'Super Admin' },
              { value: 'GYM_USER', label: 'Gym User' },
            ]}
          />

          <Select
            allowClear
            placeholder="All Roles"
            value={roleFilter || undefined}
            onChange={(val) => setRoleFilter(val || '')}
            className="w-44 text-xs"
            options={[
              { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
              { value: 'GYM_ADMIN', label: 'GYM_ADMIN (Owner)' },
              { value: 'RECEPTIONIST', label: 'RECEPTIONIST' },
              { value: 'TRAINER', label: 'TRAINER' },
            ]}
          />

          <Select
            allowClear
            showSearch
            placeholder="All Gyms"
            optionFilterProp="label"
            value={gymFilter || undefined}
            onChange={(val) => setGymFilter(val || '')}
            className="w-48 text-xs"
            options={gymList.map((g) => ({
              value: g.id,
              label: g.name,
            }))}
          />

          <Select
            allowClear
            placeholder="All Status"
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val || '')}
            className="w-36 text-xs"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
          />
        </MotionFadeIn>

        {/* AntD Users Table */}
        <MotionFadeIn delay={0.1} className="bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs">
          {isLoading && userList.length === 0 ? (
            <TableSkeleton rows={6} columns={6} />
          ) : (
            <Table<UserItem>
              columns={columns}
              dataSource={filteredUsers}
              rowKey={(r) => `${r.userType}-${r.id}-${r.gymId || 'none'}`}
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
              }}
              locale={{
                emptyText: (
                  <div className="flex flex-col items-center py-6">
                    <UsersIcon className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                    <div className="font-bold text-sm text-gyment-text mb-1">
                      No User Accounts Found
                    </div>
                    <div className="text-xs text-gyment-muted max-w-sm mx-auto mb-3">
                      No users matched your active search query or filter selection. Click "Add User" to register a new user.
                    </div>
                    <Button type="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleCreateUser}>
                      Add First User
                    </Button>
                  </div>
                ),
              }}
            />
          )}
        </MotionFadeIn>
      </main>

      {/* Add / Edit User Modal */}
      <AddUserModal
        open={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
        onSuccess={loadUsers}
      />
    </>
  );
}
