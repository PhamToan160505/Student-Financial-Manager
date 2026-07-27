import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal — Reusable confirmation dialog.
 * Replaces all window.confirm() calls in the app.
 * Usage: <ConfirmModal isOpen onClose onConfirm title message confirmLabel confirmVariant />
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmLabel = 'Xác nhận',
  confirmVariant = 'danger',
  icon: Icon = AlertTriangle,
  loading = false
}) {
  const iconColor = confirmVariant === 'danger' ? 'text-danger' : 'text-primary';
  const iconBg = confirmVariant === 'danger' ? 'bg-danger-light' : 'bg-primary/10';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 p-2 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <p className="text-sm text-neutral-subtext leading-relaxed pt-1">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="md" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button variant={confirmVariant} size="md" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
