import React, { useState } from 'react';
import { PieChart, Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import useBudget from '../hooks/useBudget';
import Navbar from '../components/common/Navbar';
import BudgetSummary from '../components/budget/BudgetSummary';
import CashflowForecastCard from '../components/budget/CashflowForecastCard';
import BudgetCard from '../components/budget/BudgetCard';
import BudgetModal from '../components/budget/BudgetModal';
import ConfirmModal from '../components/common/ConfirmModal';
import Button from '../components/common/Button';

/**
 * BudgetPage - View layer displaying summary, alerts, grid of cards, and modals
 */
export default function BudgetPage() {
  const {
    loading,
    error,
    month,
    setMonth,
    budgets,
    warnings,
    summary,
    forecast,
    upsertBudget,
    deleteBudget
  } = useBudget();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Month navigation helpers without timezone shift
  const handlePrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    let newM = m - 1;
    let newY = y;
    if (newM <= 0) {
      newM = 12;
      newY -= 1;
    }
    setMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    let newM = m + 1;
    let newY = y;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleOpenCreateModal = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCard = (item) => {
    setSelectedCategory(item);
    setIsModalOpen(true);
  };

  const handleDeleteCard = (item) => {
    setDeletingItem(item);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    await deleteBudget(deletingItem.id);
    setDeleteLoading(false);
    setDeletingItem(null);
  };

  return (
    <div className="app-page">
      <Navbar />
      <main id="main-content" className="app-main animate-fadeIn">
        <div className="space-y-7">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="flex items-start gap-3.5">
                <div className="page-icon">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="page-title">Quản lý ngân sách</h1>
              <p className="page-description">
                Thiết lập hạn mức chi tiêu cho từng danh mục trong tháng
              </p>
            </div>
          </div>

        {/* Month Selector & Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigation */}
          <div className="flex items-center bg-white/80 border border-white rounded-2xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-neutral-600 hover:text-neutral-maintext transition-all cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 font-bold text-sm text-neutral-maintext">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Tháng {month}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-neutral-600 hover:text-neutral-maintext transition-all cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            icon={Plus}
          >
            Thiết lập hạn mức
          </Button>
        </div>
      </div>

      {/* Budget Summary & Alerts */}
      <BudgetSummary
        summary={summary}
        warnings={warnings}
        loading={loading}
      />

      {/* Cashflow Forecast & Runway Section */}
      <CashflowForecastCard
        forecast={forecast}
        loading={loading}
      />

      {/* Budget Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-maintext flex items-center gap-2">
            <span>Hạn mức chi tiêu</span>
            {!loading && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">
                {budgets.length} danh mục
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-neutral-border p-4.5" />
            ))}
          </div>
        ) : budgets && budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {budgets.map((item) => (
              <BudgetCard
                key={item.category_id}
                item={item}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-border p-12 text-center shadow-2xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
              <PieChart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-maintext">
              Chưa có danh mục chi tiêu nào
            </h3>
            <p className="text-sm text-neutral-subtext mt-1 max-w-md mx-auto">
              Vui lòng tạo danh mục chi tiêu trước hoặc bấm vào nút bên dưới để thiết lập hạn mức đầu tiên!
            </p>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              icon={Plus}
              className="mt-6"
            >
              Thiết lập hạn mức
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={upsertBudget}
        categories={budgets}
        selectedCategory={selectedCategory}
        currentMonth={month}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa hạn mức"
        message={`Bạn có chắc chắn muốn xóa hạn mức ngân sách của danh mục "${deletingItem?.category_name}" cho tháng ${month} không? Hành động này sẽ không ảnh hưởng đến các giao dịch đã ghi nhận.`}
        confirmLabel="Xóa hạn mức"
        loading={deleteLoading}
      />
        </div>
      </main>
    </div>
  );
}
