import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useCategories } from '../hooks/useCategories';
import transactionService from '../services/transaction.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Navbar from '../components/common/Navbar';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import { useNavigate } from 'react-router-dom';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import TransactionModal from '../components/transaction/TransactionModal';
import MonthPicker from '../components/common/MonthPicker';
import { LayoutDashboard, Calendar as CalendarIcon, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useBudget from '../hooks/useBudget';
import BudgetWarningBanner from '../components/budget/BudgetWarningBanner';

export default function DashboardPage() {
  const { stats, loading, error, month, setMonth, refetch, fetchAvailableBalance } = useDashboard();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const { warnings: budgetWarnings, summary: budgetSummary } = useBudget(month);
  
  const [availableBalanceData, setAvailableBalanceData] = useState(null);

  React.useEffect(() => {
    fetchAvailableBalance().then(setAvailableBalanceData);
  }, [fetchAvailableBalance]);

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
    <div className="min-h-screen bg-neutral-bg font-sans pb-20">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
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
                <MonthPicker
                  value={month}
                  onChange={setMonth}
                  className="text-sm font-bold text-neutral-maintext bg-transparent focus:outline-none cursor-pointer whitespace-nowrap"
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

            </div>
          </div>

      {/* States: Loading / Error / Data */}
      {loading && (
        <div className="space-y-6">
          <DashboardSummary 
            stats={stats} 
            loading={loading} 
            availableBalanceData={availableBalanceData} 
          />
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
        <div className="space-y-6">
          <BudgetWarningBanner warnings={budgetWarnings} totalBudget={Number(budgetSummary?.total_budget || 0)} />
          
          {/* 1. 4 KPI Cards */}
          <DashboardSummary summary={stats.summary} loading={false} availableBalanceData={availableBalanceData} />

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
              onNavigateToAll={() => navigate('/transactions')}
              onAddTransaction={() => setShowCreateModal(true)}
            />
          </div>
        </div>
      )}

      {/* Transaction Modal triggered directly from Dashboard */}
      <TransactionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTransaction}
        categories={categories}
        initialDate={
          (() => {
            const today = new Date();
            const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            return (month >= currentMonthStr) ? today.toISOString().slice(0, 10) : `${month}-01`;
          })()
        }
      />
        </div>
      </main>
    </div>
  );
}
