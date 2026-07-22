const Groq = require('groq-sdk');
const env = require('../config/env');
const chatMessageModel = require('../models/chatMessage.model');
const forecastService = require('../services/forecast.service');
const dashboardModel = require('../models/dashboard.model');
const { getCurrentMonthVN } = require('../utils/timezone');
const { sendSuccess, sendError } = require('../utils/response');

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new Groq({ apiKey: apiKey.trim() });
}

/**
 * Chat Controller - Handles global floating AI Financial Advisor chat
 * with Dynamic Context Injection (including Category Breakdown) & Sliding Window token saving.
 */
const chatController = {
  /**
   * Get recent chat history (IDOR protected)
   */
  getHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const messages = await chatMessageModel.getRecentHistory(userId, 30);
      return sendSuccess(res, { messages }, 'Lấy lịch sử trò chuyện thành công');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Clear all chat history for current user (IDOR protected)
   */
  clearHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      await chatMessageModel.clearHistory(userId);
      return sendSuccess(res, null, 'Xóa lịch sử trò chuyện thành công');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Send message to AI Advisor with Dynamic Context Injection & Anti-Hallucination rules
   */
  sendMessage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { message } = req.body;

      // 1. Strict validation (max 500 chars)
      if (!message || typeof message !== 'string' || !message.trim()) {
        return sendError(res, 'Tin nhắn không được để trống', 400);
      }
      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 500) {
        return sendError(res, 'Tin nhắn không được vượt quá 500 ký tự để bảo vệ hạn mức AI', 400);
      }

      // 2. Save user message to persistent DB
      await chatMessageModel.addMessage({
        userId,
        role: 'user',
        content: trimmedMessage
      });

      // 3. Concurrently fetch dynamic financial context & sliding window (last 8 messages)
      const currentMonth = getCurrentMonthVN();
      const [forecastData, categoryBreakdown, recentHistory] = await Promise.all([
        forecastService.calculateForecast(userId, currentMonth),
        dashboardModel.getCategoryBreakdown({ userId, month: currentMonth }),
        chatMessageModel.getRecentHistory(userId, 8)
      ]);

      // Format category breakdown cleanly
      let breakdownText = 'Chưa có chi tiêu theo danh mục tháng này.';
      if (categoryBreakdown && categoryBreakdown.length > 0) {
        breakdownText = categoryBreakdown.map(item => {
          const catName = item.category_name || 'Khác';
          const spentAmt = Number(item.total_spent || 0).toLocaleString('vi-VN');
          const pct = Math.round(item.percentage || 0);
          return `• ${catName}: ${spentAmt} đ (${pct}%)`;
        }).join('\n  ');
      }

      const groq = getGroqClient();
      if (!groq) {
        const fallbackReply = '⚠️ Hệ thống AI Cố Vấn hiện chưa cấu hình API Key. Vui lòng kiểm tra lại thiết lập Groq.';
        return sendSuccess(res, {
          reply: { role: 'assistant', content: fallbackReply }
        }, 'Gửi tin nhắn thành công (Fallback)');
      }

      // 4. Construct rich System Prompt with Anti-Hallucination boundaries and Category Breakdown
      const systemPrompt = `Bạn là Trợ lý & Cố vấn Tài chính AI cá nhân chuyên biệt cho sinh viên/freelancer Việt Nam (chạy trên model \`openai/gpt-oss-120b\`).

Dưới đây là Ngữ cảnh Tài chính tháng hiện tại (${currentMonth}) của người dùng đang trò chuyện:
- Tổng thu nhập đã ghi nhận: ${forecastData.totalIncomeSoFar.toLocaleString('vi-VN')} đ
- Tổng chi tiêu đã ghi nhận: ${forecastData.totalSpentSoFar.toLocaleString('vi-VN')} đ
- Số dư hiện tại (Thu - Chi): ${(forecastData.totalIncomeSoFar - forecastData.totalSpentSoFar).toLocaleString('vi-VN')} đ
- Hạn mức ngân sách tháng: ${forecastData.budgetSource !== 'none' ? forecastData.budgetTotalUsed.toLocaleString('vi-VN') + ' đ (' + (forecastData.budgetSource === 'budget' ? 'Ngân sách thiết lập' : 'Thu nhập fallback') + ')' : 'Chưa thiết lập'}
- Tốc độ chi tiêu gia quyền/ngày (Burn Rate): ${forecastData.burnRates.combinedWeightedDaily.toLocaleString('vi-VN')} đ/ngày
- Dự báo tổng chi cả tháng: ${forecastData.forecastTotalMonthlySpend.toLocaleString('vi-VN')} đ
- Thời gian cạn kiệt (Runway): ${forecastData.runwayDays === null ? 'Chưa có ngân sách' : (forecastData.runwayDays >= 999 ? 'An toàn (> 30 ngày)' : forecastData.runwayDays + ' ngày nữa')}
- Trạng thái dòng tiền: ${forecastData.status === 'danger' ? 'Nguy cơ thâm hụt' : (forecastData.status === 'caution' ? 'Chú ý ngân sách' : 'Ổn định an toàn')}
- Chi tiêu theo danh mục tháng này:
  ${breakdownText}

QUY TẮC TRẢ LỜI (BẮT BUỘC TUÂN THỦ):
1. Khi người dùng hỏi cụ thể về số liệu tài chính của họ (ví dụ: "tháng này tôi tiêu bao nhiêu cho ăn uống?", "số dư còn lại bao nhiêu?"), bạn BẮT BUỘC CHỈ SỬ DỤNG đúng các con số trong Ngữ cảnh Tài chính và Chi tiêu theo danh mục ở trên. TUYỆT ĐỐI KHÔNG tự tính toán sai lệch hay bịa đặt con số không có thật.
2. Khi người dùng hỏi các câu hỏi tự do về kiến thức tài chính chung, mẹo tiết kiệm, cách chia lương (ví dụ: "lương 2 triệu chia thế nào?", "quy tắc 50/30/20 là gì?"), bạn HÃY TỰ DO trả lời đầy đủ, sinh động dựa trên kiến thức tài chính thực chiến của bạn.
3. Trả lời bằng văn bản tự nhiên, thân thiện, súc tích (1 - 4 đoạn văn, có thể dùng Markdown bullet points hoặc emoji nhẹ nhàng), không trả về định dạng JSON thô.`;

      // Prepare sliding window messages array for Groq
      const messagesForAI = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      ];

      // 5. Call Groq AI within robust try/catch
      try {
        console.log(`[Chat Controller] Sending request to Groq (${env.AI_MODEL || 'openai/gpt-oss-120b'}) with ${recentHistory.length} context messages...`);
        const completion = await groq.chat.completions.create({
          messages: messagesForAI,
          model: 'openai/gpt-oss-120b', // Exactly mandatory model
          temperature: 0.35,
          max_tokens: 800
        });

        const aiReplyContent = completion.choices[0]?.message?.content || 'Xin lỗi, tôi chưa thể đưa ra câu trả lời lúc này.';

        // Save valid AI reply to persistent history
        await chatMessageModel.addMessage({
          userId,
          role: 'assistant',
          content: aiReplyContent
        });

        return sendSuccess(res, {
          reply: { role: 'assistant', content: aiReplyContent }
        }, 'Gửi tin nhắn và nhận phản hồi AI thành công');

      } catch (aiErr) {
        console.error('[Chat Controller] Groq API call failed or rate limited:', aiErr.message);
        // Graceful fallback message - DO NOT save to chat_messages table in DB!
        const fallbackMessage = '⚠️ Hệ thống AI Cố Vấn hiện đang quá tải hoặc hết hạn mức miễn phí tạm thời. Bạn vui lòng nghỉ tay vài phút rồi trò chuyện tiếp nhé!';
        return sendSuccess(res, {
          reply: { role: 'assistant', content: fallbackMessage }
        }, 'Gửi tin nhắn thành công (Fallback AI error)');
      }
    } catch (err) {
      next(err);
    }
  }
};

module.exports = chatController;
