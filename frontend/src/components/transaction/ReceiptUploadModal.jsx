import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Sparkles, CheckCircle, AlertTriangle, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';
import Button from '../common/Button';
import receiptService from '../../services/receipt.service';
import transactionService from '../../services/transaction.service';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCategoryEmoji } from '../../utils/emoji';

/**
 * ReceiptUploadModal - AI OCR scanning, image preview, and categorization form
 */
const ReceiptUploadModal = ({ isOpen, onClose, categories, onSuccess }) => {
  const [step, setStep] = useState('upload'); // 'upload' | 'scanning' | 'review'
  const [scanProgressText, setScanProgressText] = useState('Đang chuẩn bị quét...');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // AI OCR extracted raw data & receipt details
  const [receiptData, setReceiptData] = useState(null);
  const [initialAIValues, setInitialAIValues] = useState(null);

  // Editable Form state
  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    categoryId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Filter expense categories only
  const expenseCategories = (categories || []).filter(c => c.type === 'expense');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('upload');
      setUploadedFile(null);
      setImagePreviewUrl(null);
      setReceiptData(null);
      setInitialAIValues(null);
      setFormData({
        amount: '',
        merchant: '',
        categoryId: expenseCategories[0]?.id || '',
        transactionDate: new Date().toISOString().split('T')[0],
        note: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      toast.error('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    setUploadedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setStep('scanning');
    setScanProgressText('Đang tải ảnh lên hệ thống bảo mật Cloudinary...');

    // Simulate scanning progress UX stages while API call executes
    const progressTimer1 = setTimeout(() => {
      setScanProgressText('Tesseract.js đang nhận diện chữ (vie+eng)...');
    }, 1500);

    const progressTimer2 = setTimeout(() => {
      setScanProgressText('Groq AI (openai/gpt-oss-120b) đang bóc tách và phân loại...');
    }, 4500);

    try {
      const uploadData = new FormData();
      uploadData.append('receipt', file);

      const res = await receiptService.uploadAndScan(uploadData);
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      const receipt = res.data?.data?.receipt || res.data?.receipt;
      if (!receipt) {
        throw new Error('Không nhận được dữ liệu hóa đơn từ server');
      }

      setReceiptData(receipt);

      // Populate form with AI extracted values
      const suggestedAmount = receipt.ocrExtractedAmount ? String(receipt.ocrExtractedAmount) : '';
      const suggestedMerchant = receipt.ocrExtractedMerchant || '';
      const defaultCatId = receipt.aiSuggestedCategoryId || expenseCategories[0]?.id || '';

      const initialValues = {
        amount: suggestedAmount,
        merchant: suggestedMerchant,
        categoryId: String(defaultCatId)
      };
      setInitialAIValues(initialValues);

      setFormData({
        amount: suggestedAmount,
        merchant: suggestedMerchant,
        categoryId: String(defaultCatId),
        transactionDate: new Date().toISOString().split('T')[0],
        note: suggestedMerchant ? `Hóa đơn từ ${suggestedMerchant}` : 'Quét hóa đơn AI'
      });

      setStep('review');
      toast.success('Quét hóa đơn AI thành công!');
    } catch (err) {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi quét hóa đơn';
      toast.error(msg);
      setStep('upload');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Determine if user modified any AI suggested fields (Point 4 & 5)
  const isModifiedByUser = () => {
    if (!initialAIValues) return true;
    return (
      String(formData.amount) !== String(initialAIValues.amount) ||
      String(formData.merchant) !== String(initialAIValues.merchant) ||
      String(formData.categoryId) !== String(initialAIValues.categoryId)
    );
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Vui lòng chọn danh mục chi tiêu');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        receiptId: receiptData.id,
        categoryId: Number(formData.categoryId),
        type: 'expense',
        amount: Number(formData.amount),
        transactionDate: formData.transactionDate,
        note: formData.note || `Hóa đơn ${formData.merchant || 'AI'}`,
        merchant: formData.merchant || '',
        isModifiedByUser: isModifiedByUser()
      };

      await transactionService.createFromReceipt(payload);
      toast.success(isModifiedByUser() ? '✅ Đã lưu giao dịch (đã điều chỉnh thủ công)' : '✨ Đã lưu giao dịch AI tự động bóc tách!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu giao dịch từ hóa đơn';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if AI gave partial / null suggestions (Graceful degradation warning - Point 8 & 10)
  const isDegradedOrPartial = receiptData && (!receiptData.ocrExtractedAmount || !receiptData.aiSuggestedCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-border flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-neutral-maintext">Quét & Phân Loại Hóa Đơn AI</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-subtext hover:text-neutral-maintext hover:bg-neutral-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: UPLOAD / CAPTURE */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-neutral-border rounded-xl bg-white hover:border-primary/50 transition-colors text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-base text-neutral-maintext mb-1">Chụp ảnh hoặc chọn hóa đơn</h4>
              <p className="text-sm text-neutral-subtext max-w-md mb-6">
                Hỗ trợ ảnh hóa đơn bán lẻ, siêu thị, Highlands, Circle K, ShopeePay (định dạng JPG, PNG, WEBP tối đa 5MB)
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  variant="primary"
                  onClick={() => cameraInputRef.current?.click()}
                  icon={Camera}
                  className="shadow-md"
                >
                  Chụp ảnh camera ngay
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  icon={Upload}
                >
                  Chọn file ảnh từ máy
                </Button>
              </div>

              {/* Camera Input (Directly triggers rear/device camera) */}
              <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Standard File Browser Input */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* STEP 2: SCANNING & PROCESSING ANIMATION */}
          {step === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="relative w-48 h-64 rounded-xl overflow-hidden shadow-lg border border-neutral-border mb-6 bg-black/10">
                {imagePreviewUrl && (
                  <img src={imagePreviewUrl} alt="Receipt Preview" className="w-full h-full object-cover opacity-80" />
                )}
                {/* Laser Scanning Effect */}
                <div className="absolute inset-0 border-2 border-primary/60 rounded-xl animate-pulse"></div>
                <div className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_12px_#2563EB] animate-bounce"></div>
              </div>

              <div className="flex items-center gap-2 text-primary font-medium text-base mb-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{scanProgressText}</span>
              </div>
              <p className="text-xs text-neutral-subtext max-w-sm">
                AI đang nhận diện chữ tiếng Việt có dấu và phân loại tự động vào danh mục chi tiêu của bạn...
              </p>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM FORM */}
          {step === 'review' && receiptData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Image Preview & OCR Raw Text */}
              <div className="flex flex-col gap-4">
                <div className="relative rounded-xl overflow-hidden border border-neutral-border bg-black/5 aspect-[3/4] flex items-center justify-center">
                  <img 
                    src={imagePreviewUrl || receiptData.imageUrl} 
                    alt="Receipt" 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" /> Cloudinary CDN
                  </div>
                </div>

                {receiptData.ocrRawText && (
                  <details className="text-xs border border-neutral-border rounded-lg p-2.5 bg-neutral-bg/30">
                    <summary className="font-medium text-neutral-subtext cursor-pointer flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Xem văn bản thô bóc tách được (OCR)
                    </summary>
                    <pre className="mt-2 p-2 bg-white rounded border border-neutral-border text-neutral-maintext font-mono text-[10px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {receiptData.ocrRawText}
                    </pre>
                  </details>
                )}
              </div>

              {/* Right Column: Editable Transaction Form */}
              <form onSubmit={handleSubmitTransaction} className="flex flex-col gap-4" noValidate>
                
                {/* Graceful Degradation / Partial Scan Warning Banner */}
                {isDegradedOrPartial && (
                  <div className="p-3 rounded-xl bg-warning-light/20 border border-warning/30 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-neutral-maintext">
                      <p className="font-semibold text-warning mb-0.5">AI bóc tách được một phần thông tin</p>
                      <p>Hệ thống đã đọc được chữ OCR từ ảnh. Tuy nhiên, AI chưa điền tự động số tiền/danh mục (có thể do server chưa cấu hình <b>GROQ_API_KEY</b> trong file .env hoặc ảnh có nhiều số tiền phức tạp). Vui lòng kiểm tra và nhập bổ sung bên dưới.</p>
                    </div>
                  </div>
                )}

                {!isDegradedOrPartial && (
                  <div className="p-3 rounded-xl bg-success-light/20 border border-success/30 flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <div className="text-xs text-neutral-maintext">
                      <span className="font-semibold text-success">AI bóc tách hoàn tất!</span> Kiểm tra nhanh và bấm lưu vào sổ thu chi.
                    </div>
                  </div>
                )}

                {/* Amount Field */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-maintext mb-1.5">
                    Số tiền thanh toán <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      name="amount"
                      required
                      min="1000"
                      step="1000"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="VD: 45000"
                      className="w-full pl-3 pr-16 py-2 rounded-xl border border-neutral-border bg-white text-neutral-maintext font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="absolute right-3 top-2 text-xs font-medium text-neutral-subtext">VNĐ</span>
                  </div>
                  {formData.amount && (
                    <p className="text-[11px] text-primary mt-1 font-medium">
                      = {formatCurrency(Number(formData.amount))}
                    </p>
                  )}
                </div>

                {/* Merchant / Store */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-maintext mb-1.5">
                    Tên cửa hàng / Dịch vụ
                  </label>
                  <input 
                    type="text"
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleInputChange}
                    placeholder="VD: Highlands Coffee, Circle K..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-border bg-white text-neutral-maintext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-maintext mb-1.5">
                    Danh mục chi tiêu <span className="text-danger">*</span>
                  </label>
                  <select 
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-neutral-border bg-white text-neutral-maintext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {getCategoryEmoji(cat.icon)} {cat.name} ({cat.type === 'expense' ? 'Chi' : 'Thu'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Date */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-maintext mb-1.5">
                    Ngày giao dịch
                  </label>
                  <input 
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-neutral-border bg-white text-neutral-maintext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-maintext mb-1.5">
                    Ghi chú
                  </label>
                  <input 
                    type="text"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="VD: Uống cà phê cùng nhóm đồ án..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-border bg-white text-neutral-maintext text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Status Indicator for Audit Trail (`nguon`) */}
                <div className="text-[11px] text-neutral-subtext pt-1 flex items-center justify-between border-t border-neutral-border">
                  <span>Nguồn ghi nhận:</span>
                  <span className={`font-semibold ${isModifiedByUser() ? 'text-warning' : 'text-primary'}`}>
                    {isModifiedByUser() ? '✍️ Điều chỉnh thủ công' : '🤖 AI tự động bóc tách'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 mt-auto">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setStep('upload');
                      setUploadedFile(null);
                      setImagePreviewUrl(null);
                    }}
                    className="flex-1"
                  >
                    Quét ảnh khác
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={submitting}
                    icon={Sparkles}
                    className="flex-1"
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu giao dịch'}
                  </Button>
                </div>

              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReceiptUploadModal;
