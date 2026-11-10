'use client';

import React, { useEffect } from 'react';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  habitTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  habitTitle,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] text-[var(--ink-primary)] max-w-md w-full p-6 border border-[var(--border-color)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="neo-btn absolute top-4 right-4 p-1.5 border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[#FB7185] cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#FB7185] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-black shadow-sm">
            <AlertTriangle className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-black dark:text-white">Delete Habit?</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">Irreversible Action</span>
          </div>
        </div>

        <p className="text-sm text-stone-700 dark:text-stone-300 font-medium mb-6">
          Are you sure you want to delete <strong className="text-black dark:text-white bg-[var(--paper-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">&ldquo;{habitTitle}&rdquo;</strong>? All associated 365-day streak records will be permanently removed.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <BrutalistButton variant="white" size="md" onClick={onClose}>
            Cancel
          </BrutalistButton>
          <BrutalistButton variant="danger" size="md" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>Yes, Delete Habit</span>
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};
