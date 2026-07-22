const Groq = require('groq-sdk');
const env = require('../config/env');
const categoryModel = require('../models/category.model');

// Helper to dynamically get Groq client from process.env without static caching
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new Groq({ apiKey: apiKey.trim() });
}

function normalizeVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Helper to find exact total next to critical keywords in raw OCR text (Deterministic rule to prevent LLM arithmetic hallucination)
function findExactTotalInRawText(rawText) {
  if (!rawText) return null;
  const lines = rawText.split(/\r?\n/);
  const keywordsNorm = ['tong cong', 'tong thanh toan', 'thanh tien', 'phai tra', 'giao dich thanh cong', 'chuyen khoan thanh cong', 'so tien chuyen', 'tong tien thanh toan', 'khach phai tra'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNorm = normalizeVietnamese(line);

    for (const kw of keywordsNorm) {
      if (lineNorm.includes(kw)) {
        // Check this line AND the next 2 lines (in case the number is wrapped to the next line due to receipt layout)
        for (let offset = 0; offset <= 2; offset++) {
          if (i + offset >= lines.length) break;
          const targetLine = lines[i + offset];
          const matches = [...targetLine.matchAll(/(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?|\d{4,10})/g)];
          for (const match of matches) {
            const cleanNumStr = match[0].replace(/[.,\s]/g, '');
            const num = Number(cleanNumStr);
            if (!isNaN(num) && num >= 1000 && num <= 1000000000) {
              const targetNorm = normalizeVietnamese(targetLine);
              if (offset > 0 && (targetNorm.includes('khach dua') || targetNorm.includes('tien thoi') || targetNorm.includes('tien thua'))) {
                continue;
              }
              console.log(`[Categorization Service] Deterministic rule matched keyword "${kw}" on line ${i + offset} ("${targetLine}") -> ${num}`);
              return num;
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Categorization Service - Analyzes OCR raw text using Groq AI (`openai/gpt-oss-120b`)
 * to extract amount, merchant, and suggest the best matching user category ID.
 */
const categorizationService = {
  /**
   * Analyze raw text and categorize against user's categories
   * @param {string} rawText - OCR extracted text
   * @param {number} userId - User ID to fetch valid categories
   */
  categorizeReceipt: async (rawText, userId) => {
    // Fetch valid expense categories for this specific user
    const userCategories = await categoryModel.findByUserId(userId);
    const expenseCategories = userCategories.filter(c => c.type === 'expense');

    const groq = getGroqClient();

    // If no raw text or no groq configured, return empty structure gracefully
    if (!rawText || !rawText.trim() || !groq) {
      if (!groq) {
        console.warn('[Categorization Service] Groq API key is empty/not configured in process.env. Returning null suggestions (Graceful Degradation).');
      }
      return {
        amount: null,
        merchant: '',
        suggestedCategoryId: null
      };
    }

    // Check deterministic exact keyword total first from OCR text
    const exactRegexAmount = findExactTotalInRawText(rawText);

    try {
      // Prepare categories list prompt
      const categoriesListStr = expenseCategories
        .map(c => `ID: ${c.id}, Tên: "${c.name}"`)
        .join('\n');

      const systemPrompt = `Bạn là chuyên gia bóc tách dữ liệu hóa đơn và phân tích tài chính tại Việt Nam (AI Financial Specialist).
Nhiệm vụ của bạn là đọc hiểu đoạn văn bản thô (OCR) từ hóa đơn, biên lai chuyển tiền (MoMo/ZaloPay/Banking), hóa đơn siêu thị, nhà hàng tại Việt Nam và trích xuất thành JSON chính xác.

Danh sách các danh mục chi tiêu hợp lệ của người dùng này:
${categoriesListStr}

QUY TẮC NGHIỆP VỤ ĐẶC THÙ VIỆT NAM (HUẤN LUYỆN CHUYÊN SÂU & CHỐNG ẢO GIÁC):
1. PHÂN BIỆT & TRÍCH XUẤT CHÍNH XÁC SỐ TIỀN THANH TOÁN (EXACT AMOUNT EXTRACTION - QUAN TRỌNG NHẤT):
   - TUYỆT ĐỐI KHÔNG TỰ Ý CỘNG TRỪ HAY TÍNH TOÁN (DO NOT SUM OR CALCULATE). Mô hình KHÔNG được cộng gộp tiền hàng + chiết khấu + thuế PDV/VAT.
   - CHỈ ĐƯỢC PHÉP đọc và trích xuất đúng con số nằm ngay cạnh/dưới dòng chữ cuối cùng chốt đơn: "Tổng cộng", "Tổng thanh toán", "Thành tiền", "Giao dịch thành công", "Số tiền chuyển", "Phải trả".
   - Ví dụ thực tế (Hóa đơn KPOP MUSIC): Nếu OCR ghi:
     "Tổng tiền hàng: 209,000 / Chiết khấu: 15,000 / PDV: 19,400 / Tổng Cộng: 213,400"
     -> BẮT BUỘC lấy chính xác số tiền ở dòng "Tổng Cộng" là 213400 (TUYỆT ĐỐI KHÔNG cộng 209000 + 15000 + 19400 thành 243400).
   - LOẠI TRỪ các con số gây nhiễu: "Tiền khách đưa", "Tiền thừa/thối lại", "Điểm tích lũy", số điện thoại, số tài khoản, mã giao dịch.
   - Chuẩn hóa format: Nếu OCR đọc "213.400đ" hoặc "213,400" hoặc "213k" -> chuyển thành số nguyên 213400.
2. NHẬN DIỆN THƯƠNG HIỆU & DANH MỤC (VIETNAMESE MERCHANT & CATEGORY):
   - Nếu merchant là: "Circle K", "GS25", "Highlands", "Phúc Long", "KFC", "Bách Hóa Xanh", "Siêu thị", "Quán cơm" -> ưu tiên chọn ID của danh mục "Ăn uống" hoặc "Chợ, siêu thị".
   - Nếu merchant là: "Grab", "Be", "Xăng Petrolimex", "Gửi xe", "Phương Trang" -> ưu tiên chọn ID của danh mục "Di chuyển" / "Xe cộ".
   - Nếu merchant là: "K POP MUSIC", "Karaoke", "Billiards", "Cinema", "Game" -> ưu tiên chọn ID của danh mục "Giải trí".
   - Nếu merchant là: "Fahasa", "Nhà sách", "Tiền học phí", "Photo photo" -> ưu tiên chọn ID của danh mục "Học tập".
   - Nếu merchant là: "Tiền nhà", "Điện nước", "Internet VNPT/FPT" -> ưu tiên chọn ID của danh mục "Nhà ở" / "Hóa đơn".
   - Nếu là ảnh chuyển tiền cá nhân (MoMo/Banking) -> lấy tên người nhận/nội dung làm merchant.

Yêu cầu output trả về đúng định dạng JSON object duy nhất gồm các trường sau:
- "amount": Số tiền thanh toán thực tế là số tự nhiên hoặc float (ví dụ: 213400). Nếu không xác định được rõ ràng, trả về null.
- "merchant": Tên cửa hàng, thương hiệu hoặc người thụ hưởng ngắn gọn (ví dụ: "K POP MUSIC" hoặc "MoMo - PHAM BAO NGUYEN"). Nếu không rõ, trả về chuỗi rỗng "".
- "suggested_category_id": ID (chỉ số nguyên INT) của danh mục chi tiêu phù hợp nhất trong Danh sách hợp lệ phía trên. Nếu không xác định được, trả về null.

CHÚ Ý QUAN TRỌNG:
- BẮT BUỘC chỉ sử dụng ID trong danh sách đã cung cấp. KHÔNG bịa đặt hay tự tạo ID khác.
- Phải trả về JSON hợp lệ tuyệt đối, không có văn bản giải thích nào khác.`;

      const userPrompt = `Đoạn văn bản thô OCR từ hóa đơn:\n"""\n${rawText.slice(0, 3000)}\n"""\n\nCHÚ Ý TỐI CAO CHO TRƯỜNG "amount": Tìm chính xác con số đứng cạnh dòng "Tổng cộng", "Tổng thanh toán", "Thành tiền", "Giao dịch thành công". TUYỆT ĐỐI KHÔNG CỘNG GỘP (KHÔNG lấy Tiền hàng + Chiết khấu + PDV). Nếu thấy "Tổng Cộng: 213,400" thì "amount" phải là 213400.`;

      console.log('[Categorization Service] Calling Groq AI...');
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'openai/gpt-oss-120b', // Mandatory model exactly as specified in README & SKILL
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0]?.message?.content || '{}';
      console.log('[Categorization Service] Groq AI Response:', responseContent);
      let parsed = {};
      try {
        parsed = JSON.parse(responseContent);
      } catch (parseErr) {
        console.warn('[Categorization Service] Failed to parse JSON from Groq:', responseContent);
      }

      // 1. Extract Amount safely & apply deterministic keyword total override if AI hallucinated arithmetic
      let amount = null;
      if (exactRegexAmount !== null) {
        amount = exactRegexAmount;
        if (parsed.amount && Number(parsed.amount) !== exactRegexAmount) {
          console.log(`[Categorization Service] Overriding AI amount (${parsed.amount}) with deterministic keyword total (${exactRegexAmount})`);
        }
      } else if (parsed.amount !== null && parsed.amount !== undefined && !isNaN(Number(parsed.amount))) {
        const numAmount = Number(parsed.amount);
        if (numAmount > 0 && numAmount <= 100000000000) {
          amount = numAmount;
        }
      }

      // 2. Extract Merchant safely
      let merchant = '';
      if (parsed.merchant && typeof parsed.merchant === 'string') {
        merchant = parsed.merchant.trim().slice(0, 150);
      }

      // 3. Validate suggested_category_id against user's actual valid categories (Point 3)
      let suggestedCategoryId = null;
      if (parsed.suggested_category_id !== null && parsed.suggested_category_id !== undefined) {
        const suggestedIdNum = Number(parsed.suggested_category_id);
        const validMatch = expenseCategories.find(c => c.id === suggestedIdNum);
        if (validMatch) {
          suggestedCategoryId = validMatch.id;
        } else {
          // Fallback to "Khác (Chi)" if AI hallucinated an invalid ID
          const otherCat = expenseCategories.find(c => c.name.toLowerCase().includes('khác'));
          suggestedCategoryId = otherCat ? otherCat.id : (expenseCategories[0]?.id || null);
          console.warn(`[Categorization Service] AI hallucinated invalid category ID (${parsed.suggested_category_id}). Fallback to category ID (${suggestedCategoryId}).`);
        }
      }

      return {
        amount,
        merchant,
        suggestedCategoryId
      };
    } catch (err) {
      // Graceful degradation (Point 10): If Groq fails due to rate limits/network, return null suggestions
      console.warn(`[Categorization Service] Groq AI call failed (${err.message}). Graceful degradation triggered.`);
      return {
        amount: null,
        merchant: '',
        suggestedCategoryId: null
      };
    }
  }
};

module.exports = categorizationService;
