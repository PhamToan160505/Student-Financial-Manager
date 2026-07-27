import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getCategoryEmoji } from '../../utils/emoji';
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle2, History, Archive, RefreshCw, Sparkles } from 'lucide-react';

export default function JarCard({ jar, onEdit, onDelete, onDeposit, onWithdraw, onViewHistory, onToggleArchive }) {
  const emoji = getCategoryEmoji(jar.icon);
  
  const current = Number(jar.current_amount);
  const target = Number(jar.target_amount);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
  
  const isCompleted = jar.status === 'completed';
  const isArchived = jar.status === 'archived';
  const isActive = jar.status === 'active';

  return (
    <Card className="relative flex flex-col h-full group cursor-pointer" onClick={() => onViewHistory(jar)}>
      {/* Actions Menu - Floating top right */}
      <div className="absolute top-4 right-4 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-neutral-border/60">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewHistory(jar); }}
          title="Lịch sử"
          className="p-1.5 rounded-lg text-primary hover:bg-primary-light/50 transition-colors"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(jar); }}
          title="Sửa"
          className="p-1.5 rounded-lg text-neutral-subtext hover:text-neutral-maintext hover:bg-neutral-bg transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        
        {!isArchived ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleArchive(jar, 'archived'); }}
            title="Lưu trữ hũ này"
            className="p-1.5 rounded-lg text-warning-dark hover:bg-warning-light transition-colors"
          >
            <Archive className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleArchive(jar, 'active'); }}
            title="Khôi phục hũ"
            className="p-1.5 rounded-lg text-success hover:bg-success-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {current === 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(jar); }}
            title="Xóa hũ"
            className="p-1.5 rounded-lg text-danger hover:bg-danger-light transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Header Info */}
      <div className="flex items-start gap-3 mb-4 pr-12">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
          style={{ backgroundColor: `${jar.color}20` }}
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-neutral-maintext text-base truncate">{jar.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            {isCompleted ? (
              <Badge label="Đã đạt mục tiêu!" variant="success" size="sm" icon={CheckCircle2} />
            ) : isArchived ? (
              <Badge label="Đã lưu trữ" variant="neutral" size="sm" />
            ) : null}
          </div>
          <div className="flex flex-col gap-0.5 mt-1.5">
            <p className="text-xs font-medium text-neutral-subtext">
              Mục tiêu: <span className="font-bold text-neutral-maintext">{target.toLocaleString('vi-VN')}đ</span>
            </p>
            <p className="text-[11px] font-medium text-neutral-subtext opacity-80 whitespace-nowrap truncate">
              Thời hạn: {new Date(jar.created_at).toLocaleDateString('vi-VN')} — {jar.target_date ? new Date(jar.target_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-primary">{current.toLocaleString('vi-VN')}đ</span>
          <span className="text-xs font-semibold text-neutral-subtext">{progress}%</span>
        </div>
        
        <div className="w-full h-2.5 bg-neutral-bg rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom Area (Pushed to bottom) */}
      <div className="mt-auto pt-2">
        {/* Cảnh báo đóng định kỳ hoặc Trạng thái linh hoạt */}
        {isActive && !isCompleted && (
          jar.has_long_term_target ? (
            <div className={`p-2.5 rounded-xl border mb-3 text-[11px] font-medium flex items-start gap-2 ${
              jar.warning_level === 2 ? 'bg-danger-light border-danger/20 text-danger' : 
              jar.warning_level === 1 ? 'bg-warning-light border-warning/20 text-warning-dark' : 
              'bg-success-light border-success/20 text-success'
            }`}>
              {jar.warning_level > 0 ? <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              <div>
                <p className="mb-0.5 font-semibold">Cần đóng tháng này: {jar.monthly_target.toLocaleString('vi-VN')}đ</p>
                <p className="opacity-80">
                  Đã đóng: {jar.monthly_deposited.toLocaleString('vi-VN')}đ 
                  {jar.warning_level > 0 && ` — Còn thiếu: ${jar.monthly_missing.toLocaleString('vi-VN')}đ`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl border border-neutral-border/60 bg-neutral-bg/60 mb-3 text-[11px] font-medium flex items-center gap-2 text-neutral-subtext">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Hũ tiết kiệm linh hoạt — Gửi tiền bất kỳ lúc nào</span>
            </div>
          )
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
