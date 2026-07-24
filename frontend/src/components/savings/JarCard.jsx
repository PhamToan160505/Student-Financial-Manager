import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getCategoryEmoji } from '../../utils/emoji';
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle2, History } from 'lucide-react';

export default function JarCard({ jar, onEdit, onDelete, onDeposit, onWithdraw, onViewHistory }) {
  const emoji = getCategoryEmoji(jar.icon);
  
  const current = Number(jar.current_amount);
  const target = Number(jar.target_amount);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
  
  const isCompleted = jar.status === 'completed';
  const isArchived = jar.status === 'archived';
  const isActive = jar.status === 'active';

  // Format date if exists
  let deadlineStr = null;
  if (jar.target_date && !isCompleted && !isArchived) {
    const d = new Date(jar.target_date);
    deadlineStr = d.toLocaleDateString('vi-VN');
  }

  return (
    <Card className="flex flex-col h-full group cursor-pointer" onClick={() => onViewHistory(jar)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
            style={{ backgroundColor: `${jar.color}20` }}
          >
            {emoji}
          </div>
          <div>
            <h3 className="font-bold text-neutral-maintext text-base line-clamp-1">{jar.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {isCompleted ? (
                <Badge label="Đã đạt mục tiêu!" variant="success" size="sm" icon={CheckCircle2} />
              ) : isArchived ? (
                <Badge label="Đã lưu trữ" variant="neutral" size="sm" />
              ) : (
                <p className="text-xs font-medium text-neutral-subtext">
                  Mục tiêu: <span className="text-neutral-maintext">{target.toLocaleString('vi-VN')}đ</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" icon={History} onClick={(e) => { e.stopPropagation(); onViewHistory(jar); }} title="Lịch sử" className="text-primary" />
          <Button variant="ghost" size="sm" icon={Pencil} onClick={(e) => { e.stopPropagation(); onEdit(jar); }} title="Sửa" />
          {current === 0 && (
            <Button variant="ghost" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); onDelete(jar); }} title="Xóa" className="text-danger hover:bg-danger-light hover:text-danger" />
          )}
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-primary">{current.toLocaleString('vi-VN')}đ</span>
          <span className="text-xs font-semibold text-neutral-subtext">{progress}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-neutral-bg rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cảnh báo đóng định kỳ */}
        {isActive && jar.has_long_term_target && !isCompleted && (
          <div className={`p-2.5 rounded-xl border mb-3 text-[11px] font-medium flex items-start gap-2 ${
            jar.warning_level === 2 ? 'bg-danger-light border-danger/20 text-danger' : 
            jar.warning_level === 1 ? 'bg-warning-light border-warning/20 text-warning-dark' : 
            'bg-success-light border-success/20 text-success'
          }`}>
            {jar.warning_level > 0 ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            <div>
              <p className="mb-0.5">Cần đóng tháng này: {jar.monthly_target.toLocaleString('vi-VN')}đ</p>
              <p className="opacity-80">
                Đã đóng: {jar.monthly_deposited.toLocaleString('vi-VN')}đ 
                {jar.warning_level > 0 && ` — Còn thiếu: ${jar.monthly_missing.toLocaleString('vi-VN')}đ`}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 pt-3 border-t border-neutral-border">
          <Button 
            variant="primary" 
            className="flex-1" 
            onClick={(e) => { e.stopPropagation(); onDeposit(jar); }}
            disabled={isCompleted || isArchived}
            icon={ArrowUpCircle}
          >
            Gửi vào
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-danger/30 text-danger hover:bg-danger-light" 
            onClick={(e) => { e.stopPropagation(); onWithdraw(jar); }}
            disabled={current === 0}
            icon={ArrowDownCircle}
          >
            Rút ra
          </Button>
        </div>
      </div>
    </Card>
  );
}
