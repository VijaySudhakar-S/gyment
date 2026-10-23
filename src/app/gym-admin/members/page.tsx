'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import { GymMember, GymMembershipPlan, GymTrainer, CreateMemberDto } from '@/types/gymAdmin';
import { MembersFilterBar } from '@/components/gym-admin/members/MembersFilterBar';
import { MembersTable } from '@/components/gym-admin/members/MembersTable';
import { MemberDetailDrawer } from '@/components/gym-admin/members/MemberDetailDrawer';
import { AddMemberModal } from '@/components/gym-admin/members/AddMemberModal';
import { EditMemberModal } from '@/components/gym-admin/members/EditMemberModal';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Download } from 'lucide-react';
import { App } from 'antd';
import type { TablePaginationConfig } from 'antd';

export default function GymAdminMembersPage() {
  const { message } = App.useApp();

  const [members, setMembers] = useState<GymMember[]>([]);
  const [plans, setPlans] = useState<GymMembershipPlan[]>([]);
  const [trainers, setTrainers] = useState<GymTrainer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modals & Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<GymMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<GymMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch filter dropdown options once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [plansRes, trainersRes] = await Promise.allSettled([
          gymAdminApi.getMembershipPlans(),
          gymAdminApi.getTrainers(),
        ]);
        if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.data)) {
          setPlans(plansRes.value.data);
        }
        if (trainersRes.status === 'fulfilled' && Array.isArray(trainersRes.value?.data)) {
          setTrainers(trainersRes.value.data);
        }
      } catch (e) {
        console.error('Failed to load filter options', e);
      }
    };
    fetchOptions();
  }, []);

  // Fetch members with debounced search and pagination from API
  const fetchMembers = useCallback(async (page: number = 1, pageSize: number = 10) => {
    try {
      setIsLoading(true);
      const res = await gymAdminApi.getMembers({
        search: debouncedSearch.trim() || undefined,
        plan: selectedPlan || undefined,
        trainer: selectedTrainer || undefined,
        status: selectedStatus || undefined,
        page,
        limit: pageSize,
      });

      if (res && res.data) {
        setMembers(res.data);
        if (res.pagination) {
          setPagination({
            current: res.pagination.page,
            pageSize: res.pagination.limit,
            total: res.pagination.total,
          });
        } else {
          setPagination((prev) => ({
            ...prev,
            current: page,
            total: res.data.length,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedPlan, selectedTrainer, selectedStatus]);

  // When filters or debounced search change, reset to page 1
  useEffect(() => {
    fetchMembers(1, pagination.pageSize);
  }, [fetchMembers]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const nextCurrent = newPagination.current || 1;
    const nextSize = newPagination.pageSize || 10;
    fetchMembers(nextCurrent, nextSize);
  };

  const handleAddMember = async (dto: CreateMemberDto) => {
    try {
      await gymAdminApi.createMember(dto);
      message.success('Member created successfully');
      fetchMembers(pagination.current, pagination.pageSize);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create member';
      message.error(errMsg);
      throw err;
    }
  };

  const handleUpdateMember = async (id: string | number, dto: Partial<CreateMemberDto> & { status?: string }) => {
    try {
      await gymAdminApi.updateMember(id, dto);
      message.success('Member updated successfully');
      fetchMembers(pagination.current, pagination.pageSize);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update member';
      message.error(errMsg);
      throw err;
    }
  };

  const handleDeleteMember = async (member: GymMember) => {
    try {
      await gymAdminApi.deleteMember(member.id);
      message.success(`${member.name} deleted successfully`);
      fetchMembers(pagination.current, pagination.pageSize);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete member';
      message.error(errMsg);
    }
  };

  const handleRenewMember = async (id: string | number) => {
    try {
      await gymAdminApi.quickRenewMember(id);
      message.success('Member renewed successfully');
      fetchMembers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Failed to renew member');
    }
  };

  const handleExportCSV = () => {
    message.success('Exporting members as CSV...');
  };

  return (
    <>
      <GymAdminTopbar
        title="Members"
        subtitle="Manage your gym members and membership information."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="border border-gyment-border bg-white hover:bg-gyment-bg text-gyment-text px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <PrimaryButton
              onClick={() => setIsAddModalOpen(true)}
              icon={<Plus className="w-4 h-4 stroke-[2.4]" />}
            >
              Add Member
            </PrimaryButton>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto space-y-4 pb-24 md:pb-12">
        {/* Filter Bar with Debounced Search */}
        <MotionFadeIn delay={0.04}>
          <MembersFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedPlan={selectedPlan}
            onPlanChange={setSelectedPlan}
            selectedTrainer={selectedTrainer}
            onTrainerChange={setSelectedTrainer}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            membershipPlans={plans}
            trainers={trainers}
          />
        </MotionFadeIn>

        {/* AntD Members Table with API pagination */}
        <MotionFadeIn delay={0.1}>
          <MembersTable
            members={members}
            isLoading={isLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members`,
            }}
            onChange={handleTableChange}
            onViewMember={(m) => {
              setSelectedMember(m);
              setIsDrawerOpen(true);
            }}
            onEditMember={(m) => {
              setMemberToEdit(m);
              setIsEditModalOpen(true);
            }}
            onDeleteMember={handleDeleteMember}
            onAddMember={() => setIsAddModalOpen(true)}
          />
        </MotionFadeIn>

        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddMember}
          membershipPlans={plans}
          trainers={trainers}
        />

        {/* Edit Member Modal */}
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setMemberToEdit(null);
          }}
          onSubmit={handleUpdateMember}
          member={memberToEdit}
          membershipPlans={plans}
          trainers={trainers}
        />

        {/* Member Details Drawer */}
        <MemberDetailDrawer
          member={selectedMember}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onRenew={handleRenewMember}
          onEdit={(m) => {
            setMemberToEdit(m);
            setIsEditModalOpen(true);
          }}
          onDelete={handleDeleteMember}
        />
      </main>
    </>
  );
}
