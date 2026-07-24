import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import ConfirmModal from '../components/common/ConfirmModal';
import Modal from '../components/common/Modal';
import {
  Palette, Sparkles, CheckCircle, AlertTriangle, XCircle,
  Plus, Tag, PieChart, ArrowLeftRight, ShieldCheck
} from 'lucide-react';

/**
 * StyleguidePage - Design System & UI/UX Audit Verification Hub
 * Showcases unified color tokens, high-contrast WCAG AA badges, component library, and copy dictionary.
 */
export default function StyleguidePage({ onNavigateToPage }) {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sampleInput, setSampleInput] = useState('450000');

  return (
    <>
      <Navbar activePage="styleguide" onNavigateToPage={onNavigateToPage} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 space-y-10 animate-fadeIn">
        
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-primary-light text-primary rounded-2xl">
              <Palette className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-maintext tracking-tight">
                  Design System & UI Styleguide
                </h1>
                <Badge label="V2.0 Standard" variant="primary" size="sm" />
              </div>
              <p className="text-sm text-neutral-subtext mt-1">
                Chuẩn hóa màu sắc (Trắng & Xanh Dương), chuẩn độ tương phản WCAG AA, cùng từ điển từ vựng (Copy/Labels).
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigateToPage?.('dashboard')}>
            Trở về Dashboard
          </Button>
        </div>

        {/* Section 1: Color Palette & WCAG AA Compliance */}
        <Card title="1. Bảng màu chủ đạo & Khả năng tiếp cận (WCAG AA)" subtitle="Hệ màu sắc tách biệt chuẩn Tailwind CSS, hỗ trợ tương phản cao cho chữ cảnh báo">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Primary Blue */}
            <div className="p-4 rounded-2xl border border-neutral-border bg-white space-y-3">
              <div className="h-16 rounded-xl bg-primary flex items-end p-2.5 text-white font-bold text-sm shadow-inner">
                Primary (#2563EB)
              </div>
              <div className="flex justify-between text-xs font-semibold text-neutral-subtext">
                <span className="px-2 py-1 rounded bg-primary-light text-primary">Light (#EFF6FF)</span>
                <span className="px-2 py-1 rounded bg-primary-hover text-white">Hover (#1D4ED8)</span>
              </div>
              <p className="text-[11px] text-neutral-subtext">Dùng cho Navbar filled pill, nút chính, và điểm nhấn.</p>
            </div>

            {/* Success Green */}
            <div className="p-4 rounded-2xl border border-neutral-border bg-white space-y-3">
              <div className="h-16 rounded-xl bg-success flex items-end p-2.5 text-white font-bold text-sm shadow-inner">
                Success (#16A34A)
              </div>
              <div className="flex justify-between text-xs font-semibold text-neutral-subtext">
                <span className="px-2 py-1 rounded bg-success-light text-success">Light (#F0FDF4)</span>
              </div>
              <p className="text-[11px] text-neutral-subtext">Ghi nhận khoản thu nhập, trạng thái an toàn (&lt; 80%).</p>
            </div>

            {/* Warning Amber (WCAG AA) */}
            <div className="p-4 rounded-2xl border border-neutral-border bg-white space-y-3">
              <div className="h-16 rounded-xl bg-warning flex items-end p-2.5 text-neutral-maintext font-bold text-sm shadow-inner">
                Warning (#F59E0B)
              </div>
              <div className="flex flex-col gap-1.5 text-xs font-semibold">
                <span className="px-2 py-1 rounded bg-warning-light text-warning-dark">
                  WCAG AA (#B45309) — Text cảnh báo 80-99%
                </span>
                <span className="px-2 py-1 rounded bg-warning-light text-warning-darker">
                  Darker (#9A3412) — Tương phản tối đa
                </span>
              </div>
              <p className="text-[11px] text-neutral-subtext">Khắc phục lỗi nhạt màu chữ trên nền vàng nhạt.</p>
            </div>

            {/* Danger Red */}
            <div className="p-4 rounded-2xl border border-neutral-border bg-white space-y-3">
              <div className="h-16 rounded-xl bg-danger flex items-end p-2.5 text-white font-bold text-sm shadow-inner">
                Danger (#DC2626)
              </div>
              <div className="flex justify-between text-xs font-semibold text-neutral-subtext">
                <span className="px-2 py-1 rounded bg-danger-light text-danger">Light (#FEF2F2)</span>
              </div>
              <p className="text-[11px] text-neutral-subtext">Chi tiêu, cảnh báo vượt hạn mức (≥ 100%), xóa dữ liệu.</p>
            </div>

          </div>
        </Card>

        {/* Section 2: Copy Dictionary (Từ điển Chuẩn nhãn nút) */}
        <Card title="2. Từ điển Nhãn nút & Chức năng (Copy Standard)" subtitle="Đảm bảo 100% nhất quán giữa Header, Empty State, và Modal trên tất cả các trang">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-bg/60 text-neutral-subtext font-bold text-xs uppercase">
                  <th className="p-3">Trang / Chức năng</th>
                  <th className="p-3">Nhãn Chuẩn (Thống nhất)</th>
                  <th className="p-3">Biểu tượng</th>
                  <th className="p-3">Trạng thái áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                <tr>
                  <td className="p-3 font-semibold text-neutral-maintext">Dashboard / Sổ thu chi</td>
                  <td className="p-3"><span className="px-2.5 py-1 rounded-lg bg-primary-light text-primary font-bold text-xs">+ Thêm giao dịch</span></td>
                  <td className="p-3"><Plus className="w-4 h-4 text-primary" /></td>
                  <td className="p-3"><Badge label="Đã đồng bộ 100%" variant="success" size="sm" /></td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-maintext">Quản lý Danh mục</td>
                  <td className="p-3"><span className="px-2.5 py-1 rounded-lg bg-primary-light text-primary font-bold text-xs">+ Thêm danh mục</span></td>
                  <td className="p-3"><Plus className="w-4 h-4 text-primary" /></td>
                  <td className="p-3"><Badge label="Đã đồng bộ 100%" variant="success" size="sm" /></td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-maintext">Quản lý Ngân sách</td>
                  <td className="p-3"><span className="px-2.5 py-1 rounded-lg bg-primary-light text-primary font-bold text-xs">+ Thiết lập hạn mức</span></td>
                  <td className="p-3"><Plus className="w-4 h-4 text-primary" /></td>
                  <td className="p-3"><Badge label="Đã đồng bộ 100%" variant="success" size="sm" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Section 3: Component Library Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Buttons Showcase */}
          <Card title="3. Nút bấm (Button Variations)" subtitle="Tất cả các variant và size chuẩn trong hệ thống">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-neutral-subtext uppercase mb-2">Variants (Size MD)</p>
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Button variant="primary" icon={Plus}>Primary Button</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-subtext uppercase mb-2">Sizes (Primary)</p>
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Button variant="primary" size="sm">Small (SM)</Button>
                  <Button variant="primary" size="md">Medium (MD)</Button>
                  <Button variant="primary" size="lg">Large (LG)</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Badges Showcase */}
          <Card title="4. Nhãn & Thẻ trạng thái (Badges)" subtitle="Hiển thị trạng thái an toàn, cảnh báo, hoặc nhãn mặc định">
            <div className="flex flex-wrap gap-3 items-center py-4">
              <Badge label="Primary Badge" variant="primary" size="md" />
              <Badge label="An toàn (<80%)" variant="success" size="md" />
              <Badge label="Sắp chạm ngưỡng (WCAG AA)" variant="warning" size="md" />
              <Badge label="Vượt ngân sách (≥100%)" variant="danger" size="md" />
            </div>
          </Card>

          {/* Form Inputs Showcase */}
          <Card title="5. Form Inputs & Currency Formatting" subtitle="Input số tiền với ngăn cách hàng nghìn rõ ràng">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-maintext mb-1">
                  Nhập số tiền mẫu (VNĐ)
                </label>
                <Input
                  type="text"
                  value={Number(sampleInput || 0).toLocaleString('vi-VN')}
                  onChange={(e) => setSampleInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                />
                <p className="text-xs text-primary font-medium mt-1">
                  Hiển thị thực tế: {Number(sampleInput || 0).toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </Card>

          {/* Modals & Interactive Elements */}
          <Card title="6. Modals & Hộp thoại xác nhận" subtitle="Kiểm tra lớp phủ, bo góc, và hiệu ứng transition">
            <div className="flex flex-wrap gap-3 py-4">
              <Button variant="outline" onClick={() => setShowDemoModal(true)}>
                Mở Modal Demo
              </Button>
              <Button variant="primary" className="bg-danger hover:bg-danger/90 border-danger text-white" onClick={() => setShowConfirmModal(true)}>
                Mở Confirm Modal Xóa
              </Button>
            </div>
          </Card>

        </div>

        {/* Demo Modals */}
        <Modal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} title="Hộp thoại kiểm tra Styleguide">
          <div className="space-y-4 py-2">
            <p className="text-sm text-neutral-subtext">
              Đây là mẫu chuẩn cho Modal của hệ thống Tài Chính Sinh Viên. Bo góc <code className="bg-neutral-bg px-1 py-0.5 rounded border border-neutral-border">rounded-3xl</code>, đổ bóng mượt mà và nền trắng tinh khôi.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-border">
              <Button variant="secondary" onClick={() => setShowDemoModal(false)}>Đóng lại</Button>
              <Button variant="primary" onClick={() => setShowDemoModal(false)}>Tuyệt vời!</Button>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => setShowConfirmModal(false)}
          title="Xác nhận thao tác nguy hiểm"
          message="Bạn có chắc chắn muốn xóa mục thử nghiệm này khỏi hệ thống không? Hành động này minh họa cho ConfirmModal chuẩn."
          confirmLabel="Đồng ý xóa"
        />

      </main>
    </>
  );
}
