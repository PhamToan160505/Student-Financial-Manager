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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-maintext/45 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`relative bg-[#fffdfa] w-full ${sizes[size] || sizes.md} rounded-t-[2rem] sm:rounded-[1.6rem] border border-white/80 shadow-lg animate-slideUp flex flex-col max-h-[92dvh] sm:max-h-[86dvh]`}>
        {/* Header */}
        <div className="flex-none flex items-start justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-border/70">
          <div>
            <h3 className="text-xl font-bold text-neutral-maintext leading-tight tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-neutral-subtext mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 grid h-9 w-9 place-items-center rounded-xl text-neutral-subtext hover:bg-neutral-bg hover:text-neutral-maintext transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 flex-1 overflow-y-auto no-scrollbar">
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
