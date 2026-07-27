import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Navbar from '../components/common/Navbar';
import ConfirmModal from '../components/common/ConfirmModal';
import CategoryModal from '../components/category/CategoryModal';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Tag, RefreshCw,
  AlertCircle, ShieldCheck, TrendingDown, TrendingUp
} from 'lucide-react';
import { getCategoryEmoji } from '../utils/emoji';

function CategoryItem({ category, onEdit, onDelete }) {
  const emoji = getCategoryEmoji(category.icon);

  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-bg/60 transition-colors group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {emoji}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-neutral-maintext">{category.name}</p>
            {Boolean(category.is_default) ? (
              <Badge label="Mặc định" variant="primary" size="sm" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Actions only for user-created (non-default) categories */}
      {!Boolean(category.is_default) ? (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => onEdit(category)} title="Sửa" />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onDelete(category)} title="Xóa" className="text-danger hover:bg-danger-light hover:text-danger" />
        </div>
      ) : (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-4 h-4 text-primary/40" title="Danh mục hệ thống, không thể sửa/xóa" />
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { expense, income, loading, error, refetch, createCategory, updateCategory, removeCategory } = useCategories();

  const [activeTab, setActiveTab] = useState('expense');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (form) => {
    await createCategory(form);
  };

  const handleEdit = async (form) => {
    await updateCategory(editingCategory.id, form);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await removeCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (err) {
      toast.error(err.message || 'Xóa danh mục thất bại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentList = activeTab === 'expense' ? expense : income;
  const userCategories = currentList.filter(c => !c.is_default).sort((a, b) => {
    const aIsOther = a.name.toLowerCase().includes('khác');
    const bIsOther = b.name.toLowerCase().includes('khác');
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return 0;
  });
  const defaultCategories = currentList.filter(c => c.is_default).sort((a, b) => {
    const aIsOther = a.name.toLowerCase().includes('khác');
    const bIsOther = b.name.toLowerCase().includes('khác');
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-neutral-bg font-sans pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-maintext flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Quản lý Danh mục
              </h2>
              <p className="text-sm text-neutral-subtext mt-0.5">
                Phân loại thu nhập & chi tiêu của bạn
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Thêm danh mục
            </Button>
          </div>

      {/* Tab Switcher */}
      <div className="bg-neutral-bg/80 p-1.5 rounded-xl border border-neutral-border inline-flex">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'expense'
              ? 'bg-white text-danger shadow-sm'
              : 'text-neutral-subtext hover:text-neutral-maintext'
            }`}
        >
          <TrendingDown className="w-4 h-4" />
          Chi tiêu ({expense.length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'income'
              ? 'bg-white text-success shadow-sm'
              : 'text-neutral-subtext hover:text-neutral-maintext'
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          Thu nhập ({income.length})
        </button>
      </div>

      {/* Content States */}
      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12 gap-3 text-neutral-subtext">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm">Đang tải danh mục...</span>
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <div className="flex items-center gap-3 py-6 text-danger">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Không tải được danh mục</p>
              <p className="text-xs text-neutral-subtext mt-0.5">{error}</p>
            </div>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={refetch} className="ml-auto">
              Thử lại
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* System default categories */}
          <Card
            title="Danh mục hệ thống"
            subtitle={`${defaultCategories.length} danh mục mặc định`}
          >
            {defaultCategories.length === 0 ? (
              <p className="text-sm text-neutral-subtext text-center py-6">Không có danh mục mặc định</p>
            ) : (
              <div className="space-y-1 -mx-2">
                {defaultCategories.map(cat => (
                  <CategoryItem key={cat.id} category={cat} onEdit={() => { }} onDelete={() => { }} />
                ))}
              </div>
            )}
          </Card>

          {/* User custom categories */}
          <Card
            title="Danh mục của bạn"
            subtitle={userCategories.length === 0 ? 'Chưa có danh mục riêng nào' : `${userCategories.length} danh mục tự tạo`}
          >
            {userCategories.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-neutral-maintext mb-1">Chưa có danh mục riêng</p>
                <p className="text-xs text-neutral-subtext mb-4">Tạo danh mục phù hợp với thói quen chi tiêu của bạn</p>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
                  Thêm ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-1 -mx-2">
                {userCategories.map(cat => (
                  <CategoryItem
                    key={cat.id}
                    category={cat}
                    onEdit={setEditingCategory}
                    onDelete={setDeletingCategory}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        existingCategories={[...expense, ...income]}
      />

      <CategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={handleEdit}
        initialData={editingCategory}
        existingCategories={[...expense, ...income]}
      />

      <ConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục "${deletingCategory?.name}" không? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa danh mục"
      />
        </div>
      </main>
    </div>
  );
}
