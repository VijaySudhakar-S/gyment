'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import { GymStaff, CreateStaffDto } from '@/types/gymAdmin';
import {
  StaffView,
  AddStaffModal,
} from '@/components/gym-admin/staff/StaffComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { useGymAdmin } from '@/context/GymAdminContext';
import { App } from 'antd';
import { Plus } from 'lucide-react';

export default function GymAdminStaffPage() {
  const { message } = App.useApp();
  const { staffLimitText, featureLimits, openCompareModal } = useGymAdmin();

  const [staff, setStaff] = useState<GymStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymAdminApi.getStaff();
      if (res && Array.isArray(res.data)) {
        setStaff(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaffClick = () => {
    const rawLimit = featureLimits['Max Receptionists'] || featureLimits['Max Admins'] || featureLimits['Max Trainers'];
    if (rawLimit && String(rawLimit).toLowerCase() !== 'unlimited') {
      const parsedLimit = parseInt(String(rawLimit), 10);
      if (!isNaN(parsedLimit) && staff.length >= parsedLimit) {
        message.warning(`Staff account limit of ${parsedLimit} reached for current plan`);
        openCompareModal();
        return;
      }
    }
    setIsAddModalOpen(true);
  };

  const handleAddStaff = async (dto: CreateStaffDto) => {
    try {
      await gymAdminApi.createStaff(dto);
      message.success('Staff account created successfully');
      fetchStaff();
    } catch (err) {
      message.error('Failed to create staff account');
      throw err;
    }
  };

  const handleToggleStatus = async (id: string | number, currentStatus: string) => {
    const next = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await gymAdminApi.toggleStaffStatus(id, next);
      message.success(`Staff account marked as ${next}`);
      fetchStaff();
    } catch (err) {
      message.error('Failed to update staff status');
    }
  };

  return (
    <>
      <GymAdminTopbar
        title="Staff"
        subtitle={`Manage staff accounts for your gym (${staffLimitText}).`}
        actions={
          <PrimaryButton
            onClick={handleAddStaffClick}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.4]" />}
          >
            Add Staff
          </PrimaryButton>
        }
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-4">
        <MotionFadeIn delay={0.06}>
          <StaffView
            staff={staff}
            isLoading={isLoading}
            onAddStaffClick={handleAddStaffClick}
            onToggleStatus={handleToggleStatus}
          />
        </MotionFadeIn>

        <AddStaffModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddStaff}
        />
      </main>
    </>
  );
}
