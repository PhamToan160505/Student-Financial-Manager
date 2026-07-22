import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useCategories } from '../hooks/useCategories';
import transactionService from '../services/transaction.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import TransactionModal from '../components/transaction/TransactionModal';
import { LayoutDashboard, Calendar as CalendarIcon, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage({ onNavigateToPage }) {
  const { stats, loading, error, month, setMonth, refetch } = useDashboard();
  const { categories } = useCategories();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateTransaction = async (formData) => {
    try {
      const res = await transactionService.create(formData);
      if (res.success) {
        toast.success('Thêm giao dịch thành công!');
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm giao dịch');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-maintext flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Trung Tâm Chỉ Huy Tài Chính
          </h2>
          <p className="text-sm text-neutral-subtext mt-0.5">
            Cái nhìn toàn cảnh về dòng tiền, tỷ trọng chi tiêu và sức khỏe tài chính
          </p>
        </div>

        {/* Month Selector + Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-neutral-border shadow-xs">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-neutral-subtext">Tháng:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm font-bold text-neutral-maintext bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
            disabled={loading}
            title="Làm mới dữ liệu"
          />

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Thêm khoản thu/chi
          </Button>
        </div>
      </div>

      {/* States: Loading / Error / Data */}
      {loading && (
        <div className="space-y-6">
          <DashboardSummary loading={true} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-neutral-border h-80 animate-pulse" />
            <div className="bg-white rounded-2xl border border-neutral-border h-80 animate-pulse" />
          </div>
        </div>
      )}

      {!loading && error && (
        <Card>
          <div className="flex items-center gap-3 py-8 text-danger">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-sm font-bold">Không tải được thông tin Dashboard</p>
              <p className="text-xs text-neutral-subtext mt-0.5">{error}</p>
            </div>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={refetch} className="ml-auto">
              Thử lại
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* 1. 4 KPI Cards */}
          <DashboardSummary summary={stats.summary} loading={false} />

          {/* 2. Unified MoMo-style Analytics Panel */}
          <div className="w-full">
            <AnalyticsPanel
              categoryBreakdown={stats.categoryBreakdown}
              sixMonthTrend={stats.sixMonthTrend}
              selectedMonth={month}
              onAddTransaction={() => setShowCreateModal(true)}
            />
          </div>

          {/* 3. Recent Transactions Widget */}
          <div className="w-full">
            <RecentTransactions
              transactions={stats.recentTransactions}
              onNavigateToAll={() => onNavigateToPage && onNavigateToPage('transactions')}
              onAddTransaction={() => setShowCreateModal(true)}
            />
          </div>
        </>
      )}

      {/* Transaction Modal triggered directly from Dashboard */}
      <TransactionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTransaction}
        categories={categories}
      />
    </div>
  );
}
