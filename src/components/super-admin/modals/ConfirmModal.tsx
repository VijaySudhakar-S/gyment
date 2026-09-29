'use client';

import React from 'react';
import { Modal } from 'antd';
import { AlertTriangle, Ban, CheckCircle2, Lock } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirmModal } = useSuperAdmin();

  const handleConfirm = () => {
    confirmModal.onConfirm();
    closeConfirmModal();
  };

  return (
    <Modal
      open={confirmModal.open}
      onCancel={closeConfirmModal}
      footer={null}
      width={420}
      centered
      closable={false}
    >
      <div className="pt-2">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 ${confirmModal.isDanger
            ? 'bg-danger-light text-danger'
            : 'bg-primary-light text-primary-dark'
            }`}
        >
          {confirmModal.isDanger ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>

        <h2 className="text-[15.5px] font-bold text-gyment-text mb-1.5 leading-snug">
          {confirmModal.title}
        </h2>
        <p className="text-[12.5px] text-gyment-muted mb-6 leading-normal">
          {confirmModal.body}
        </p>

        <div className="pt-3 border-t border-gyment-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={closeConfirmModal}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-[9px] text-[13px] font-bold transition-colors shadow-sm ${confirmModal.isDanger
              ? 'bg-danger hover:bg-[#a93623] text-white'
              : 'bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer'
              }`}
          >
            {confirmModal.actionLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
