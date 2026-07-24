import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Shared Modal component. Used by CategoryModal, TransactionModal, etc.
 * Handles focus trap via ESC key, backdrop click to close.
 */
export default function Modal({ isOpen, onClose, title, subtitle = '', children, size = 'md' }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-maintext/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative bg-white w-full ${sizes[size] || sizes.md} rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slideUp flex flex-col max-h-[90vh] sm:max-h-[85vh]`}>
        {/* Header */}
        <div className="flex-none flex items-start justify-between px-6 pt-6 pb-4 border-b border-neutral-border">
          <div>
            <h3 className="text-lg font-semibold text-neutral-maintext leading-tight">{title}</h3>
            {subtitle && <p className="text-sm text-neutral-subtext mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-neutral-subtext hover:bg-neutral-bg hover:text-neutral-maintext transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
        .animate-slideUp { animation: slideUp 0.2s ease-out; }
      `}</style>
    </div>
  );
}
