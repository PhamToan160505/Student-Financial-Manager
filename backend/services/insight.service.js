const Groq = require('groq-sdk');
const env = require('../config/env');
const forecastService = require('./forecast.service');
const insightCacheModel = require('../models/insightCache.model');
const { getCurrentMonthVN } = require('../utils/timezone');

// Helper to dynamically get Groq client without static caching
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new Groq({ apiKey: apiKey.trim() });
}

/**
 * Insight Service - Generates AI financial advisory using Groq (`openai/gpt-oss-120b`).
 * Strictly bound by actual math numbers from forecastService. Uses persistent cache.
 */
const insightService = {
  /**
   * Get AI insights for user & month (with persistent cache check & safe fallbacks)
   */
  getInsights: async (userId, month) => {
    const targetMonth = (month && /^\d{4}-\d{2}$/.test(month)) ? month : getCurrentMonthVN();

    // 1. Check persistent MySQL cache first
    try {
      const cached = await insightCacheModel.getCache({ userId, month: targetMonth });
      if (cached && !cached.isStale) {
        // Check 24 hour TTL (Time-To-Live)
        const cacheAgeMs = Date.now() - new Date(cached.updatedAt).getTime();
        const TWENTY_FOUR_HOURS = 24 * 3600 * 1000;
        if (cacheAgeMs < TWENTY_FOUR_HOURS) {
          console.log(`[Insight Service] Returning non-stale persistent cache for user ${userId}, month ${targetMonth} (Age: ${Math.round(cacheAgeMs/60000)}m)`);
          return cached.cachedJson;
        }
      }
    } catch (cacheErr) {
      console.warn('[Insight Service] Cache check error, continuing to fresh generation:', cacheErr.message);
    }

    // 2. Fetch mathematical cashflow forecast data
    const forecastData = await forecastService.calculateForecast(userId, targetMonth);

    // Safe fallback object in case Groq is unconfigured or fails
    const safeFallback = {
      status: forecastData.status || 'safe',
      summary: `Hiện tại bạn đã chi ${forecastData.totalSpentSoFar.toLocaleString('vi-VN')} đ trong tháng ${targetMonth}. ${forecastData.warningMessage}`,
      key_warnings: [
        forecastData.warningMessage
      ],
      actionable_advice: [
        'Hãy tiếp tục ghi nhận chi tiêu hàng ngày hoặc bóc tách qua ảnh hóa đơn để theo dõi sát hạn mức ngân sách.',
        'Thiết lập ngân sách riêng cho từng danh mục (Ăn uống, Giải trí, Học tập) để kiểm soát dòng tiền tốt hơn.'
      ]
    };

    const groq = getGroqClient();
    if (!groq) {
      console.warn('[Insight Service] Groq API key empty or unconfigured. Returning safe fallback.');
      return safeFallback;
    }

    // 3. Prepare strict input data and system prompt (Anti-hallucination enforced)
    const inputDataStr = JSON.stringify({
      month: forecastData.month,
      currentDay: forecastData.currentDay,
      totalDays: forecastData.totalDays,
      totalSpentSoFar: forecastData.totalSpentSoFar,
      totalIncomeSoFar: forecastData.totalIncomeSoFar,
      budgetTotalUsed: forecastData.budgetTotalUsed,
      budgetSource: forecastData.budgetSource,
      combinedDailyBurnRate: forecastData.burnRates.combinedWeightedDaily,
      forecastTotalMonthlySpend: forecastData.forecastTotalMonthlySpend,
      runwayDays: forecastData.runwayDays,
      status: forecastData.status
    }, null, 2);

    const systemPrompt = `Bạn là cố vấn tài chính AI chuyên biệt cho sinh viên và freelancer Việt Nam (AI Financial Advisor).
Nhiệm vụ của bạn là đọc các chỉ số tài chính và dự báo dòng tiền chính xác trong phần Input Data, từ đó đưa ra nhận xét, cảnh báo và lời khuyên hành động thực chiến.

QUY TẮC CHỐNG ẢO GIÁC SỐ LIỆU (ANTI-HALLUCINATION ENFORCEMENT - CỰC KỲ QUAN TRỌNG):
1. BẮT BUỘC CHỈ SỬ DỤNG đúng các con số thống kê thực tế được cung cấp trong phần Input Data dưới đây.
2. TUYỆT ĐỐI KHÔNG tự tính toán, KHÔNG suy đoán hay bịa đặt thêm bất kỳ số liệu, tỷ lệ phần trăm (%) hay con số tiền tệ nào khác ngoài Input Data.
3. Lời khuyên (actionable_advice) tập trung vào phân tích thói quen và giải pháp hành động cụ thể cho đời sống sinh viên (ví dụ: mẹo tiết kiệm tiền ăn, hạn chế mua sắm ngẫu hứng, điều chỉnh chi tiêu nửa cuối tháng).
4. Phải trả về đúng 1 JSON hợp lệ tuyệt đối, không chứa văn bản giải thích ngoài JSON.

Yêu cầu định dạng JSON output gồm đúng 4 trường thuần văn bản/chuỗi/mảng chuỗi:
- "status": Chuỗi trạng thái đúng bằng 1 trong 3 giá trị: "${forecastData.status}" (hoặc "safe", "caution", "danger").
- "summary": Một đoạn tóm tắt ngắn gọn (1-2 câu) về tình hình dòng tiền hiện tại dựa trên số liệu Input Data.
- "key_warnings": Mảng chuỗi (1-2 item) chứa các điểm cần chú ý hoặc cảnh báo rủi ro cạn kiệt ngân sách.
- "actionable_advice": Mảng chuỗi (2-3 item) chứa các lời khuyên thực tế, cụ thể, dễ thực hiện cho sinh viên/freelancer.`;

    const userPrompt = `Input Data số liệu tài chính tháng ${targetMonth}:\n\`\`\`json\n${inputDataStr}\n\`\`\`\n\nHãy phân tích và trả về lời khuyên JSON theo đúng các quy tắc chống ảo giác.`;

    // 4. Call Groq AI within robust try/catch
    try {
      console.log(`[Insight Service] Calling Groq AI (${env.AI_MODEL || 'openai/gpt-oss-120b'}) to generate fresh advisory...`);
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'openai/gpt-oss-120b', // Mandatory model exactly as specified
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content || '{}';
      let parsed = null;
      try {
        parsed = JSON.parse(content);
      } catch (jsonErr) {
        console.warn('[Insight Service] Failed to parse JSON response from Groq:', content);
      }

      if (parsed && Array.isArray(parsed.actionable_advice) && parsed.actionable_advice.length > 0) {
        // Ensure status field is valid
        if (!['safe', 'caution', 'danger'].includes(parsed.status)) {
          parsed.status = forecastData.status || 'safe';
        }

        // Save to persistent MySQL cache (ONLY valid AI output gets cached)
        try {
          await insightCacheModel.setCache({
            userId,
            month: targetMonth,
            cachedJson: parsed,
            spentSnapshot: forecastData.totalSpentSoFar
          });
          console.log(`[Insight Service] Successfully saved new AI insight to cache for user ${userId}`);
        } catch (dbSaveErr) {
          console.warn('[Insight Service] Failed to save cache to MySQL:', dbSaveErr.message);
        }

        return parsed;
      } else {
        console.warn('[Insight Service] AI returned incomplete JSON format. Falling back to safe structure.');
        return safeFallback;
      }
    } catch (aiErr) {
      console.error('[Insight Service] Groq API call or processing failed:', aiErr.message);
      // DO NOT save fallback error JSON to DB cache
      return safeFallback;
    }
  }
};

module.exports = insightService;
