import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { getCategoryEmoji } from '../../utils/emoji';
import { ArrowUpCircle, ArrowDownCircle, Clock, Inbox } from 'lucide-react';
import api from '../../services/api';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function JarHistoryModal({ isOpen, onClose, jar }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !jar) return;
    setLoading(true);
    api.get(`/jars/${jar.id}/history`)
      .then(res => {
        if (res.success) setTransactions(res.data?.transactions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, jar]);

  if (!jar) return null;

  const emoji = getCategoryEmoji(jar.icon);
  const current = Number(jar.current_amount);
  const target = Number(jar.target_amount);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lịch sử giao dịch" maxWidth="max-w-lg">
      {/* Jar Header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-5" style={{ backgroundColor: `${jar.color}15`, border: `1px solid ${jar.color}30` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${jar.color}25` }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-neutral-maintext text-base truncate">{jar.name}</h3>
          <p className="text-xs text-neutral-subtext mt-0.5">
            Mục tiêu: <span className="font-semibold text-neutral-maintext">{target.toLocaleString('vi-VN')}đ</span>
          </p>
          <p className="text-[11px] font-medium text-neutral-subtext opacity-80 mt-0.5 whitespace-nowrap truncate">
            Thời hạn: {new Date(jar.created_at).toLocaleDateString('vi-VN')} — {jar.target_date ? new Date(jar.target_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold" style={{ color: jar.color }}>{current.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-neutral-subtext">{progress}% mục tiêu</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-neutral-bg rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: jar.color }} />
      </div>

      {/* Transaction List */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-neutral-subtext" />
        <h4 className="text-sm font-semibold text-neutral-maintext">Lịch sử giao dịch</h4>
        <span className="ml-auto text-xs text-neutral-subtext bg-neutral-bg px-2 py-0.5 rounded-full">{transactions.length} giao dịch</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neutral-subtext">Đang tải...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-subtext">
            <Inbox className="w-10 h-10 opacity-40" />
            <p className="text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          transactions.map(tx => {
            const isDeposit = tx.type === 'deposit';
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-bg/60 hover:bg-neutral-bg transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDeposit ? 'bg-primary/10' : 'bg-danger/10'}`}>
                  {isDeposit
                    ? <ArrowUpCircle className="w-5 h-5 text-primary" />
                    : <ArrowDownCircle className="w-5 h-5 text-danger" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-maintext">{isDeposit ? 'Gửi tiền vào hũ' : 'Rút tiền khỏi hũ'}</p>
                  {tx.note && <p className="text-xs text-neutral-subtext truncate mt-0.5">{tx.note}</p>}
                  <p className="text-xs text-neutral-subtext/60 mt-0.5">{formatDate(tx.created_at)}</p>
                </div>
                <p className={`text-sm font-bold tabular-nums shrink-0 ${isDeposit ? 'text-primary' : 'text-danger'}`}>
                  {isDeposit ? '+' : '-'}{Number(tx.amount).toLocaleString('vi-VN')}đ
                </p>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
