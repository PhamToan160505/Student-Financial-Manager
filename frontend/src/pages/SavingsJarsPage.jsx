import React, { useState, useEffect } from 'react';
import { useSavingsJars } from '../hooks/useSavingsJars';
import { useDashboard } from '../hooks/useDashboard';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import ConfirmModal from '../components/common/ConfirmModal';
import JarCard from '../components/savings/JarCard';
import JarModal from '../components/savings/JarModal';
import JarTransactionModal from '../components/savings/JarTransactionModal';
import JarHistoryModal from '../components/savings/JarHistoryModal';
import toast from 'react-hot-toast';
import { Plus, PiggyBank, Target, Archive } from 'lucide-react';

export default function SavingsJarsPage({ onNavigateToPage }) {
  const { jars, loading, error, fetchJars, createJar, updateJar, deleteJar, deposit, withdraw } = useSavingsJars();
  const { fetchAvailableBalance } = useDashboard();
  const [availableBalance, setAvailableBalance] = useState(0);

  const [activeTab, setActiveTab] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editingJar, setEditingJar] = useState(null);
  
  const [txModal, setTxModal] = useState({ isOpen: false, type: 'deposit', jar: null });
  const [historyJar, setHistoryJar] = useState(null);
  
  const [deletingJar, setDeletingJar] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJars();
    loadAvailableBalance();
  }, [fetchJars]);

  const loadAvailableBalance = async () => {
    const data = await fetchAvailableBalance();
    if (data) {
      // Clamp về 0: số âm = không còn tiền khả dụng (đã cam kết hết vào ngân sách/hũ)
      setAvailableBalance(Math.max(0, data.available_balance));
    }
  };

  const handleOpenCreate = () => {
    setEditingJar(null);
    setShowModal(true);
  };

  const handleOpenEdit = (jar) => {
    setEditingJar(jar);
    setShowModal(true);
  };

  const handleSaveJar = async (jarData) => {
    try {
      if (editingJar) {
        await updateJar(editingJar.id, jarData);
        toast.success('Cập nhật hũ thành công!');
      } else {
        await createJar(jarData);
        toast.success('Tạo hũ mới thành công!');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deletingJar) return;
    setIsDeleting(true);
    try {
      await deleteJar(deletingJar.id);
      toast.success('Xóa hũ thành công!');
      setDeletingJar(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransaction = async (jarId, { amount, note }) => {
    try {
      if (txModal.type === 'deposit') {
        await deposit(jarId, { amount, note });
        toast.success('Gửi tiền thành công!');
      } else {
        await withdraw(jarId, { amount, note });
        toast.success('Rút tiền thành công!');
      }
      loadAvailableBalance();
      setTxModal({ isOpen: false, type: 'deposit', jar: null });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Giao dịch thất bại';
      toast.error(msg);
      throw err;
    }
  };

  const activeJars = jars.filter(j => j.status === 'active');
  const completedJars = jars.filter(j => j.status === 'completed');
  const archivedJars = jars.filter(j => j.status === 'archived');

  const displayJars = activeTab === 'active' ? activeJars : activeTab === 'completed' ? completedJars : archivedJars;

  return (
    <div className="min-h-screen bg-neutral-bg font-sans pb-20">
      <Navbar activePage="savings" onNavigateToPage={onNavigateToPage} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-maintext flex items-center gap-2">
              <PiggyBank className="w-7 h-7 text-primary" />
              Hũ Tiết Kiệm
            </h1>
            <p className="text-sm text-neutral-subtext mt-1">Khóa tiền cho các mục tiêu tương lai, không tính vào chi tiêu.</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate} className="w-full md:w-auto shadow-md shadow-primary/20">
            Tạo hũ mới
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'active' ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-white text-neutral-subtext border border-neutral-border hover:bg-neutral-bg/60'
            }`}
          >
            <Target className="w-4 h-4" /> Đang tiến hành ({activeJars.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'completed' ? 'bg-success text-white shadow-sm shadow-success/30' : 'bg-white text-neutral-subtext border border-neutral-border hover:bg-neutral-bg/60'
            }`}
          >
            <PiggyBank className="w-4 h-4" /> Đã hoàn thành ({completedJars.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'archived' ? 'bg-neutral-maintext text-white shadow-sm' : 'bg-white text-neutral-subtext border border-neutral-border hover:bg-neutral-bg/60'
            }`}
          >
            <Archive className="w-4 h-4" /> Đã lưu trữ ({archivedJars.length})
          </button>
        </div>

        {loading && jars.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="bg-white h-48 rounded-2xl animate-pulse" />)}
          </div>
        ) : displayJars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayJars.map(jar => (
              <JarCard
                key={jar.id}
                jar={jar}
                onEdit={handleOpenEdit}
                onDelete={setDeletingJar}
                onDeposit={(j) => setTxModal({ isOpen: true, type: 'deposit', jar: j })}
                onWithdraw={(j) => setTxModal({ isOpen: true, type: 'withdraw', jar: j })}
                onViewHistory={(j) => setHistoryJar(j)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-border border-dashed">
            <div className="w-16 h-16 bg-neutral-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-neutral-subtext" />
            </div>
            <h3 className="text-lg font-bold text-neutral-maintext mb-1">Chưa có hũ nào</h3>
            <p className="text-sm text-neutral-subtext max-w-sm mx-auto">
              {activeTab === 'active' 
                ? 'Tạo hũ tiết kiệm để dành tiền cho các mục tiêu tài chính của bạn.' 
                : 'Chưa có hũ tiết kiệm nào trong danh sách này.'}
            </p>
          </div>
        )}
      </main>

      <JarModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={editingJar}
        onSubmit={handleSaveJar}
      />

      <JarTransactionModal
        isOpen={txModal.isOpen}
        onClose={() => setTxModal({ isOpen: false, type: 'deposit', jar: null })}
        type={txModal.type}
        jar={txModal.jar}
        availableBalance={availableBalance}
        onSubmit={handleTransaction}
      />

      <JarHistoryModal
        isOpen={!!historyJar}
        onClose={() => setHistoryJar(null)}
        jar={historyJar}
      />

      <ConfirmModal
        isOpen={!!deletingJar}
        onClose={() => setDeletingJar(null)}
        onConfirm={confirmDelete}
        title="Xóa Hũ Tiết Kiệm"
        message={deletingJar ? `Bạn có chắc muốn xóa hũ "${deletingJar.name}"? Thao tác này không thể hoàn tác.` : ''}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
}
