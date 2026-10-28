'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import { GymTrainer, CreateTrainerDto, UpdateTrainerDto } from '@/types/gymAdmin';
import {
  TrainersView,
  AddTrainerModal,
  EditTrainerModal,
} from '@/components/gym-admin/trainers/TrainersComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Plus } from 'lucide-react';
import { App } from 'antd';

export default function GymAdminTrainersPage() {
  const { message } = App.useApp();

  const [trainers, setTrainers] = useState<GymTrainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<GymTrainer | null>(null);

  const fetchTrainers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymAdminApi.getTrainers();
      if (res && Array.isArray(res.data)) {
        setTrainers(res.data);
      }
    } catch (err) {
      console.error('Failed to load trainers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleAddTrainer = async (dto: CreateTrainerDto) => {
    try {
      await gymAdminApi.createTrainer(dto);
      message.success('Trainer created successfully');
      fetchTrainers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create trainer';
      message.error(errMsg);
      throw err;
    }
  };

  const handleEditTrainer = async (id: string | number, dto: UpdateTrainerDto) => {
    try {
      await gymAdminApi.updateTrainer(id, dto);
      message.success('Trainer updated successfully');
      fetchTrainers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update trainer';
      message.error(errMsg);
      throw err;
    }
  };

  const handleDeleteTrainer = async (trainer: GymTrainer) => {
    try {
      await gymAdminApi.deleteTrainer(trainer.id);
      message.success(`${trainer.name} removed successfully`);
      fetchTrainers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete trainer';
      message.error(errMsg);
    }
  };

  return (
    <>
      <GymAdminTopbar
        title="Trainers"
        subtitle="Manage fitness trainers, access credentials, and assignments."
        actions={
          <PrimaryButton
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.4]" />}
          >
            Add Trainer
          </PrimaryButton>
        }
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-4">
        <MotionFadeIn delay={0.06}>
          <TrainersView
            trainers={trainers}
            isLoading={isLoading}
            onAddTrainerClick={() => setIsAddModalOpen(true)}
            onEditTrainerClick={(t) => {
              setSelectedTrainer(t);
              setIsEditModalOpen(true);
            }}
            onDeleteTrainerClick={handleDeleteTrainer}
          />
        </MotionFadeIn>

        <AddTrainerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTrainer}
        />

        <EditTrainerModal
          isOpen={isEditModalOpen}
          trainer={selectedTrainer}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTrainer(null);
          }}
          onSubmit={handleEditTrainer}
        />
      </main>
    </>
  );
}
