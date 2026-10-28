import React, { useState } from 'react';
import { Building2, CheckCircle2, Landmark, Link2, Plus, Tags, Trash2, Unplug } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './Button';
import ConfirmModal from './ConfirmModal';
import Input from './Input';
import { useBankAccounts } from '../../hooks/useBankAccounts';
import { useCategories } from '../../hooks/useCategories';
import { getCategoryEmoji } from '../../utils/emoji';

export default function BankConnectionSection({ active }) {
  const {
    accounts,
    categoryRules,
    integration,
    loading,
    connectAccount,
    disconnectAccount,
    saveCategoryRule,
    deleteCategoryRule
  } = useBankAccounts(active);
  const { categories, loading: categoriesLoading } = useCategories(active);
  const [accountNumber, setAccountNumber] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState(null);
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [savingRule, setSavingRule] = useState(false);
  const [removingRuleId, setRemovingRuleId] = useState(null);

  const selectableCategories = categories.filter(category => !category.name.startsWith('Khác'));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalized = accountNumber.replace(/[\s-]/g, '');
    if (!/^\d{8,20}$/.test(normalized)) {
      toast.error('Số tài khoản VietinBank phải gồm 8-20 chữ số');
      return;
    }

    setSubmitting(true);
    try {
      await connectAccount({ accountNumber: normalized, label: label.trim() });
      setAccountNumber('');
      setLabel('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể liên kết tài khoản VietinBank');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountToRemove) return;
    setRemoving(true);
    try {
      await disconnectAccount(accountToRemove.id);
      setAccountToRemove(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể ngắt liên kết ngân hàng');
    } finally {
      setRemoving(false);
    }
  };

  const handleRuleSubmit = async (event) => {
    event.preventDefault();
    const code = categoryCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,20}$/.test(code)) {
      toast.error('Mã chỉ gồm 1-20 chữ cái không dấu hoặc chữ số');
      return;
    }
    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    setSavingRule(true);
    try {
      await saveCategoryRule({ code, categoryId: Number(categoryId) });
      setCategoryCode('');
      setCategoryId('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu mã phân loại');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id) => {
    setRemovingRuleId(id);
    try {
      await deleteCategoryRule(id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa mã phân loại');
    } finally {
      setRemovingRuleId(null);
    }
  };

  return (
    <section className="space-y-4 border-t border-neutral-border/70 pt-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-maintext">Đồng bộ VietinBank</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-subtext">
            Giao dịch từ SePay sẽ tự động xuất hiện trong mục Thu chi. Hệ thống chỉ lưu mã băm và 4 số cuối tài khoản.
          </p>
        </div>
      </div>

      {integration && !integration.ready && (
        <div className="rounded-xl border border-warning/25 bg-warning-light px-3 py-2.5 text-xs leading-relaxed text-warning-darker">
          Backend chưa đủ khóa bảo mật SePay. Hãy cấu hình hai biến môi trường trước khi liên kết.
        </div>
      )}

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-neutral-bg" />
      ) : accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map(account => (
            <div key={account.id} className="flex items-center gap-3 rounded-xl border border-neutral-border bg-white/75 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success-light text-success">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-neutral-maintext">
                    {account.label || account.bank_name}
                  </p>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                </div>
                <p className="text-xs text-neutral-subtext">VietinBank •••• {account.account_number_last4}</p>
              </div>
              <button
                type="button"
                onClick={() => setAccountToRemove(account)}
                className="grid h-9 w-9 place-items-center rounded-lg text-neutral-subtext transition-colors hover:bg-danger-light hover:text-danger"
                aria-label={`Ngắt liên kết tài khoản ${account.account_number_last4}`}
                title="Ngắt liên kết"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-bg/55 px-4 py-3 text-center">
          <Unplug className="mx-auto h-5 w-5 text-neutral-subtext" />
          <p className="mt-1.5 text-xs text-neutral-subtext">Chưa có tài khoản VietinBank nào được liên kết.</p>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-neutral-border bg-white/55 p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
            <Tags className="h-4 w-4" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-neutral-maintext">Mã phân loại tự động</h5>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-subtext">
              Đặt mã cho từng danh mục. Ví dụ mã <b>E</b> sẽ nhận nội dung <b>SEVQR E</b>.
            </p>
          </div>
        </div>

        {categoryRules.length > 0 && (
          <div className="space-y-2">
            {categoryRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-2 rounded-xl border border-neutral-border bg-white px-3 py-2.5">
                <span className="rounded-lg bg-primary-light px-2 py-1 font-mono text-xs font-bold text-primary">
                  SEVQR {rule.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-maintext">
                  {getCategoryEmoji(rule.category_icon)} {rule.category_name}
                  <span className="ml-1 font-normal text-neutral-subtext">
                    ({rule.category_type === 'expense' ? 'Chi tiêu' : 'Thu nhập'})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={removingRuleId === rule.id}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-subtext transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-50"
                  aria-label={`Xóa mã ${rule.code}`}
                  title="Xóa mã"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleRuleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <Input
              id="bank-category-code"
              label="Mã"
              value={categoryCode}
              onChange={(event) => setCategoryCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="VD: E"
              maxLength={20}
              autoComplete="off"
              required
            />
            <div>
              <label htmlFor="bank-category-id" className="mb-1.5 block text-[13px] font-semibold text-neutral-maintext">
                Danh mục <span className="text-danger">*</span>
              </label>
              <select
                id="bank-category-id"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={categoriesLoading}
                required
                className="min-h-11 w-full rounded-xl border border-neutral-border bg-white/85 px-3 py-2.5 text-sm text-neutral-maintext outline-none transition-all hover:border-primary/30 focus:border-primary focus:ring-[3px] focus:ring-primary/15 disabled:cursor-not-allowed"
              >
                <option value="">Chọn danh mục</option>
                <optgroup label="Chi tiêu">
                  {selectableCategories.filter(item => item.type === 'expense').map(item => (
                    <option key={item.id} value={item.id}>{getCategoryEmoji(item.icon)} {item.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Thu nhập">
                  {selectableCategories.filter(item => item.type === 'income').map(item => (
                    <option key={item.id} value={item.id}>{getCategoryEmoji(item.icon)} {item.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            icon={Plus}
            loading={savingRule}
            disabled={categoriesLoading}
            className="w-full"
          >
            Lưu mã phân loại
          </Button>
        </form>
        <p className="text-[11px] leading-relaxed text-neutral-subtext">
          Mã không tồn tại hoặc sai loại giao dịch sẽ được lưu vào danh mục “Khác”. Mỗi mã chỉ gắn với một danh mục.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-border bg-white/55 p-3.5">
        <Input
          id="vietinbank-account-number"
          label="Số tài khoản VietinBank"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          icon={Building2}
          placeholder="Nhập số tài khoản"
          inputMode="numeric"
          autoComplete="off"
          maxLength={24}
          required
        />
        <Input
          id="vietinbank-label"
          label="Tên gợi nhớ"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Ví dụ: Tài khoản chi tiêu"
          maxLength={100}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          icon={Link2}
          loading={submitting}
          disabled={integration && !integration.ready}
          className="w-full"
        >
          Liên kết VietinBank
        </Button>
      </form>

      <ConfirmModal
        isOpen={Boolean(accountToRemove)}
        onClose={() => !removing && setAccountToRemove(null)}
        onConfirm={handleDisconnect}
        title="Ngắt liên kết VietinBank?"
        message="Các giao dịch đã đồng bộ vẫn được giữ lại, nhưng giao dịch mới của tài khoản này sẽ không được tự động nhập nữa."
        confirmLabel="Ngắt liên kết"
        loading={removing}
      />
    </section>
  );
}
