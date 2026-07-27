import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Navbar from '../components/common/Navbar';
import ConfirmModal from '../components/common/ConfirmModal';
import QuickAddChips from '../components/transaction/QuickAddChips';
import StreakBadge from '../components/transaction/StreakBadge';
import TransactionFilter from '../components/transaction/TransactionFilter';
import TransactionItem from '../components/transaction/TransactionItem';
import TransactionCalendar from '../components/transaction/TransactionCalendar';
import TransactionModal from '../components/transaction/TransactionModal';
import DailyDetailsModal from '../components/transaction/DailyDetailsModal';
import ReceiptUploadModal from '../components/transaction/ReceiptUploadModal';
import { useStreak } from '../hooks/useStreak';
import {
  Plus, ArrowLeftRight, RefreshCw, AlertCircle, Calendar, List, Camera, Sparkles
} from 'lucide-react';

export default function TransactionsPage() {
  const {
    transactions,
    summary,
    groupedByDate,
    loading: txLoading,
    error: txError,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    refetch,
    createTransaction,
    updateTransaction,
    removeTransaction
  } = useTransactions();

  const { categories, loading: catLoading } = useCategories();
  const { streakData, loading: streakLoading, refetchStreak } = useStreak();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Daily modal when clicked on calendar day
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [prefillData, setPrefillData] = useState(null);

  const handleCreate = async (formData) => {
    await createTransaction(formData);
    setPrefilledDate(null);
    refetchStreak();
  };

  const handleEdit = async (formData) => {
    await updateTransaction(editingTransaction.id, formData);
    refetchStreak();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await removeTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
      refetchStreak();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddForDate = (dateStr) => {
    setPrefilledDate(dateStr);
    setShowCreateModal(true);
  };

  const loading = txLoading || catLoading;

  return (
    <div className="min-h-screen bg-neutral-bg font-sans pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-maintext flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                Sổ Thu Chi
              </h2>
              <p className="text-sm text-neutral-subtext mt-0.5">
                Nhật ký theo dõi các khoản chi tiêu và thu nhập hàng ngày
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="md"
                icon={Sparkles}
                onClick={() => setShowReceiptModal(true)}
                className="border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
              >
                Quét hóa đơn AI
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => {
                  setPrefilledDate(new Date().toISOString().slice(0, 10));
                  setShowCreateModal(true);
                }}
              >
                Thêm giao dịch
              </Button>
            </div>
          </div>

          {/* Quick-add section */}
          <div className="bg-white p-3 rounded-2xl border border-neutral-border shadow-sm">
            <QuickAddChips 
              refreshTrigger={transactions}
              onSelectTemplate={(tpl) => {
                setPrefillData({
                  category_id: tpl.categoryId,
                  amount: '',
                  note: '',
                  type: 'expense'
                });
                setPrefilledDate(new Date().toISOString().slice(0, 10));
                setShowCreateModal(true);
              }} 
            />
          </div>

          {/* Combined Filter & Content Container */}
          <div className="bg-white rounded-2xl border border-neutral-border shadow-sm overflow-hidden">
            {/* Filter & View Mode Switcher */}
            <TransactionFilter
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              categories={categories}
              streakData={streakData}
              streakLoading={streakLoading}
            />

      {/* States: Loading / Error / Empty / Data */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-neutral-subtext">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Đang tải dữ liệu thu chi...</span>
        </div>
      )}

      {!loading && txError && (
        <div className="flex items-center gap-3 py-8 px-6 text-danger">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-sm font-bold">Không tải được nhật ký thu chi</p>
            <p className="text-xs text-neutral-subtext mt-0.5">{txError}</p>
          </div>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={refetch} className="ml-auto">
            Thử lại
          </Button>
        </div>
      )}

      {!loading && !txError && (
        <>
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <TransactionCalendar
              month={filters.month}
              groupedByDate={groupedByDate}
              onSelectDay={setSelectedDayInfo}
            />
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-neutral-maintext">Nhật ký thu chi</h3>
                <p className="text-sm text-neutral-subtext">Hiển thị {transactions.length} khoản thu/chi trong tháng</p>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ArrowLeftRight className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-base font-bold text-neutral-maintext mb-1">Chưa có khoản thu/chi nào</p>
                  <p className="text-xs text-neutral-subtext mb-5 max-w-sm mx-auto">
                    Bạn chưa ghi nhận khoản thu/chi nào phù hợp với bộ lọc hiện tại. Hãy thêm ngay để theo dõi ngân sách!
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setPrefilledDate(new Date().toISOString().slice(0, 10));
                      setShowCreateModal(true);
                    }}
                  >
                    Thêm giao dịch
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {transactions.map(tx => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onEdit={setEditingTransaction}
                      onDelete={setDeletingTransaction}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>

      {/* Create / Edit Modal */}
      <TransactionModal
        isOpen={showCreateModal || !!editingTransaction}
        isEdit={!!editingTransaction}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTransaction(null);
          setPrefilledDate(null);
          setPrefillData(null);
        }}
        onSubmit={showCreateModal ? handleCreate : handleEdit}
        initialData={editingTransaction || prefillData}
        initialDate={
          (() => {
            if (editingTransaction) return null;
            if (prefilledDate) return prefilledDate;
            const today = new Date();
            const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            return (filters.month >= currentMonthStr) ? today.toISOString().slice(0, 10) : `${filters.month}-01`;
          })()
        }
        categories={categories}
      />

      {/* Daily Details Modal (triggered by clicking calendar day) */}
      <DailyDetailsModal
        isOpen={!!selectedDayInfo}
        onClose={() => setSelectedDayInfo(null)}
        dateInfo={selectedDayInfo}
        onEditTransaction={setEditingTransaction}
        onDeleteTransaction={setDeletingTransaction}
        onAddForDate={handleAddForDate}
      />

      {/* AI OCR Receipt Upload & Categorization Modal */}
      <ReceiptUploadModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        categories={categories}
        onSuccess={refetch}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Xóa khoản giao dịch"
        message={`Bạn có chắc muốn xóa giao dịch "${deletingTransaction?.category_name} (${Number(deletingTransaction?.amount || 0).toLocaleString('vi-VN')} đ)" không? Hành động này không thể khôi phục.`}
        confirmLabel="Xóa giao dịch"
      />
        </div>
      </main>
    </div>
  );
}
