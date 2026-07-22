
# README — Hướng Dẫn Xây Dựng Dự Án Quản Lý Tài Chính Sinh Viên

> File này dành cho AI coding agent (Antigravity/Claude Code/Cursor...) đọc và triển khai theo đúng quy chuẩn dưới đây. Agent PHẢI tuân thủ nghiêm ngặt kiến trúc, quy tắc bảo mật, và convention được nêu — không tự ý thay đổi cấu trúc thư mục hay bỏ qua các bước validate.
>
> **Đây là tài liệu sống (living document)** — sẽ được cập nhật liên tục khi có phương án/đề xuất mới từ chủ dự án. Agent luôn đọc lại bản mới nhất trước khi bắt đầu bất kỳ task nào.

---

## 0. QUY TRÌNH LÀM VIỆC — BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI

Đây là quy tắc quan trọng nhất, áp dụng cho MỌI chức năng mới hoặc thay đổi bất kỳ:

### 0.1. Quy tắc "Đề xuất trước — Duyệt mới được làm"

Trước khi viết bất kỳ dòng code nào cho một chức năng mới, hoặc trước khi sửa/đổi một phần đã có, agent PHẢI:

1. Dừng lại, KHÔNG code ngay
2. Đưa ra **prompt đề xuất hướng làm**, bao gồm:
   - Mục tiêu của chức năng/thay đổi này là gì
   - Sẽ động vào những file/module nào
   - Hướng tiếp cận kỹ thuật (VD: dùng thư viện gì, thiết kế schema/API ra sao)
   - Có phương án nào khác không, ưu/nhược điểm mỗi phương án (nếu có)
3. **Chờ chủ dự án duyệt (trả lời "OK"/"duyệt"/hoặc yêu cầu sửa đề xuất)**
4. CHỈ SAU KHI được duyệt mới được phép code
5. Nếu chủ dự án yêu cầu sửa đề xuất, agent sửa lại và đưa ra bản mới, lặp lại cho tới khi được duyệt

**Cấm tuyệt đối:** tự ý code trước rồi mới báo cáo, hoặc gộp nhiều chức năng vào chung 1 đề xuất để "tiết kiệm thời gian" — mỗi chức năng/thay đổi là 1 vòng đề xuất-duyệt riêng.

### 0.2. Đi từ nhỏ đến lớn — không nhảy bước

- Triển khai đúng theo thứ tự ở mục 9 (Thứ tự triển khai), từ nền tảng → CRUD cơ bản → tính năng nâng cao
- KHÔNG được bắt đầu tính năng ở bước sau khi bước trước chưa hoàn thành và chưa được xác nhận là chạy đúng
- Mỗi bước nhỏ hoàn thành xong phải qua bước 0.3 (tự kiểm tra) trước khi coi là "xong" và chuyển bước tiếp theo

### 0.3. Tự kiểm tra sau khi hoàn thành mỗi phần

Sau khi code xong một chức năng/module bất kỳ, agent PHẢI tự rà soát lại trước khi báo cáo hoàn thành:

- Đọc lại toàn bộ code vừa viết, kiểm tra lỗi cú pháp, logic sai, edge case bỏ sót
- Kiểm tra tính nhất quán với các phần đã làm trước đó (naming, response format, cách gọi API...)
- Đối chiếu lại với checklist bảo mật ở mục 10 nếu phần vừa làm liên quan đến auth/dữ liệu người dùng
- Báo cáo ngắn gọn: đã làm gì, đã tự kiểm tra gì, có vấn đề/rủi ro gì cần chủ dự án lưu ý không

### 0.4. Cập nhật liên tục

Khi chủ dự án đưa ra phương án mới, đổi ý, hoặc bổ sung yêu cầu — agent cập nhật ngay cách làm theo hướng mới nhất, không tiếp tục theo hướng cũ đã bị thay thế.

---

## 1. TỔNG QUAN DỰ ÁN

Web quản lý tài chính cá nhân dành cho sinh viên/freelancer, có thu nhập không cố định. Tính năng chính: ghi nhận thu/chi, chụp ảnh hóa đơn tự động trích xuất bằng AI, ngân sách theo category, dự báo dòng tiền.

**Kiến trúc bắt buộc:** MVC cho cả Backend và Frontend (chi tiết ở mục 3).

---

## 2. TECH STACK

| Layer       | Công nghệ                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend    | ReactJS (Vite), TailwindCSS, Recharts                                                                                                                                            |
| Backend     | Node.js, Express                                                                                                                                                                 |
| Database    | MySQL                                                                                                                                                                            |
| Auth        | JWT (stateless)                                                                                                                                                                  |
| AI          | Groq API (free tier) — model`openai/gpt-oss-120b` (LƯU Ý: `llama-3.3-70b-versatile` đã bị Groq deprecate, tắt hoàn toàn ngày 16/8/2026 — không dùng model này) |
| File upload | Multer (nhận file tạm ở memory) + Cloudinary (lưu trữ ảnh thật, free tier)                                                                                                |

---

## 3. KIẾN TRÚC MVC — QUY ĐỊNH BẮT BUỘC

### 3.1. Backend (Express) — MVC rõ ràng, KHÔNG dồn route vào `server.js`

```
backend/
├── server.js                    # CHỈ khởi tạo app, mount middleware chung, mount routes. KHÔNG viết logic route ở đây.
├── config/
│   ├── db.js                     # Kết nối MySQL (dùng connection pool, KHÔNG dùng raw query nối chuỗi)
│   └── env.js                    # Load & validate biến môi trường
├── models/                       # Model layer — thao tác DB (query builder hoặc raw query có tham số hóa)
│   ├── user.model.js
│   ├── transaction.model.js
│   ├── income.model.js
│   ├── budget.model.js
│   ├── category.model.js
│   └── receipt.model.js
├── controllers/                  # Controller layer — nhận req, gọi model/service, trả response
│   ├── auth.controller.js
│   ├── transaction.controller.js
│   ├── income.controller.js
│   ├── budget.controller.js
│   ├── category.controller.js
│   └── receipt.controller.js
├── routes/                       # MỖI resource 1 file route riêng, mount vào server.js qua router
│   ├── auth.routes.js
│   ├── transaction.routes.js
│   ├── income.routes.js
│   ├── budget.routes.js
│   ├── category.routes.js
│   └── receipt.routes.js
├── services/                     # Business logic phức tạp, đặc biệt AI — tách khỏi controller
│   ├── ocr.service.js
│   ├── categorization.service.js
│   ├── forecast.service.js
│   └── insight.service.js
├── middleware/
│   ├── verifyToken.js            # Xác thực JWT
│   ├── validateRequest.js        # Validate input (express-validator/Joi)
│   ├── errorHandler.js           # Xử lý lỗi tập trung
│   └── rateLimiter.js
└── utils/
    └── response.js               # Chuẩn hóa format response {success, data, message}
```

**Quy tắc route:** `server.js` chỉ được phép có dạng:

```js
app.use('/api/auth', authRoutes);
app.use('/api/transactions', verifyToken, transactionRoutes);
app.use('/api/incomes', verifyToken, incomeRoutes);
// ...
```

Cấm tuyệt đối định nghĩa `app.get(...)`, `app.post(...)` trực tiếp trong `server.js` ngoài route health-check.

### 3.2. Frontend (React) — MVC tương ứng

```
frontend/src/
├── pages/                        # "View" chính — mỗi page tương ứng 1 route UI
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── TransactionsPage.jsx
│   ├── BudgetPage.jsx
├── components/                   # View con, tái sử dụng được (không chứa logic gọi API trực tiếp)
│   ├── common/                   # Button, Modal, Input... dùng chung toàn app
│   ├── transaction/
│   ├── dashboard/
├── controllers/ (hoặc hooks/)    # Logic điều phối — custom hook đóng vai trò "controller"
│   ├── useAuth.js
│   ├── useTransactions.js
│   ├── useBudget.js
├── services/                     # "Model" tầng giao tiếp API — MỌI lời gọi API đi qua đây, không gọi axios/fetch trực tiếp trong component
│   ├── api.js                    # instance axios chung, gắn interceptor JWT
│   ├── auth.service.js
│   ├── transaction.service.js
│   ├── budget.service.js
├── context/
│   └── AuthContext.jsx           # Quản lý state đăng nhập toàn cục
└── utils/
    └── formatCurrency.js
```

**Quy tắc:** Component KHÔNG được gọi `fetch`/`axios` trực tiếp. Mọi gọi API phải qua file trong `services/`, được gọi thông qua custom hook trong `controllers/` (hoặc `hooks/`), page/component chỉ gọi hook.

---

## 3.3. LƯU Ý QUAN TRỌNG VỀ AI PROVIDER — GROQ

Dự án dùng **Groq API (free tier)** thay vì OpenAI/Gemini để tiết kiệm chi phí, đúng như các module AI khác zCap đã làm (`aiChunking.js`, `aiQuestionGeneration.js`...).

**⚠️ Model bắt buộc dùng: `openai/gpt-oss-120b`**

Groq đã chính thức thông báo deprecate `llama-3.3-70b-versatile` (email gửi 17/6/2026, tắt hoàn toàn ngày **16/8/2026**), khuyến nghị chuyển sang `openai/gpt-oss-120b` hoặc `qwen/qwen3.6-27b`. Dự án chọn **`openai/gpt-oss-120b`** vì đây là model Groq khuyến nghị thay thế cho nhiều model khác gần đây (Kimi K2, Llama 4 Maverick, Qwen 3 32B...), cho thấy độ ưu tiên đầu tư dài hạn cao hơn — phù hợp cho dự án không muốn phải đổi model lại giữa chừng. **Tuyệt đối không dùng `llama-3.3-70b-versatile`** dù có thấy trong tài liệu/ví dụ code cũ nào, kể cả tài liệu training của chính AI agent.

Trước khi cài SDK, agent nên kiểm tra lại trang deprecation chính thức (`https://console.groq.com/docs/deprecations`) hoặc trang models (`https://console.groq.com/docs/models`) để xác nhận `openai/gpt-oss-120b` vẫn đang hoạt động tại thời điểm code, vì danh sách model của Groq thay đổi khá thường xuyên.

**Cần lưu ý khi thiết kế `ocrService`:** Groq chủ yếu mạnh về text generation, không chắc chắn có sẵn model vision (đọc ảnh) miễn phí ổn định như GPT-4o-mini/Gemini Flash. Trước khi code phần OCR, agent PHẢI đưa đề xuất (theo quy trình mục 0.1) làm rõ 1 trong các hướng sau để chủ dự án chọn:

- **Phương án A:** Kiểm tra xem tài khoản Groq hiện tại có quyền dùng model vision nào không (nếu Groq đã hỗ trợ) → dùng luôn cho OCR
- **Phương án B:** Tách 2 bước — dùng thư viện OCR mã nguồn mở chạy local (VD: Tesseract.js) để trích chữ từ ảnh trước, sau đó đưa text thô đó cho Groq (model text) để chuẩn hóa/trích xuất merchant_name, amount, category → cách này tận dụng được Groq free tier cho phần "hiểu ngôn ngữ", còn phần "đọc ảnh" xử lý riêng
- **Phương án C:** Dùng 1 API vision free/rẻ khác chỉ riêng cho bước OCR ảnh (VD: Google Cloud Vision free tier có hạn mức), còn mọi xử lý AI text khác (categorization, forecast insight) vẫn dùng Groq

Categorization, insight generation (thuần xử lý text) dùng Groq bình thường, không có vướng mắc gì.

---

## 3.4. LƯU TRỮ ẢNH HÓA ĐƠN — DÙNG CLOUDINARY (đã có account, free tier)

**Quy tắc cứng:** Ảnh KHÔNG được lưu trong MySQL (không dùng cột `BLOB`). Bảng `receipts` chỉ lưu **URL** trả về từ Cloudinary. Ảnh thật lưu trên Cloudinary, được serve qua CDN.

### Luồng upload

1. Frontend gửi ảnh lên backend qua `multipart/form-data` (dùng `<input type="file" accept="image/*" capture="environment">` như đã quy định ở skill `qlsv-finance-react-frontend`)
2. Backend dùng `multer` với `memoryStorage` (KHÔNG dùng `diskStorage` — không cần lưu file tạm ra ổ đĩa server) để nhận buffer ảnh
3. Backend upload buffer đó lên Cloudinary bằng SDK `cloudinary`
4. Cloudinary trả về object có `secure_url` (link ảnh) và `public_id`
5. Backend lưu `secure_url` vào cột `receipts.image_url`, lưu thêm `public_id` vào 1 cột riêng (`receipts.cloudinary_public_id`) để sau này có thể xóa ảnh trên Cloudinary khi cần (VD: user xóa giao dịch)
6. Backend tiếp tục pipeline OCR/AI như đã thiết kế (đọc ảnh từ buffer hoặc từ `secure_url` tùy phương án OCR đã chốt ở mục 3.3)

### Cập nhật schema bảng `receipts`

```sql
CREATE TABLE receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,          -- secure_url từ Cloudinary
  cloudinary_public_id VARCHAR(150) NOT NULL, -- dùng để xóa ảnh trên Cloudinary khi cần
  ocr_raw_text TEXT,
  ocr_extracted_amount DECIMAL(12,2),
  ocr_extracted_merchant VARCHAR(150),
  ai_suggested_category_id INT,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Cấu hình bắt buộc

- Biến môi trường trong `.env` (KHÔNG hardcode, KHÔNG commit lên Git):

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

- Tổ chức folder trên Cloudinary theo dạng `qlsv-finance/receipts/` để dễ quản lý, tránh lẫn với ảnh khác nếu tài khoản dùng chung cho nhiều dự án.
- Giới hạn size file trước khi upload lên Cloudinary (multer `limits: { fileSize: 5 * 1024 * 1024 }` — 5MB) để tránh tốn quota free tier.
- Kiểm tra `mimetype` chỉ cho phép `image/jpeg`, `image/png`, `image/webp` trước khi upload.
- Khi xóa 1 giao dịch có ảnh đính kèm, gọi `cloudinary.uploader.destroy(public_id)` để dọn ảnh rác, tránh tốn quota lưu trữ free tier về lâu dài.

### Package cần dùng

- `cloudinary` (SDK chính thức)
- `multer` (memoryStorage, không cần `multer-storage-cloudinary` nếu muốn kiểm soát rõ luồng upload thủ công — agent đề xuất cụ thể cách nào trước khi code theo đúng quy trình mục 0)

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1. Luồng đăng nhập

1. User đăng nhập → backend verify email/password → nếu đúng, tạo JWT chứa `{id, email}`, KHÔNG chứa password hay dữ liệu nhạy cảm
2. JWT trả về client, lưu ở `localStorage` hoặc `httpOnly cookie` (khuyến nghị dùng httpOnly cookie để giảm rủi ro XSS đánh cắp token — nếu dùng localStorage phải ý thức rõ rủi ro này)
3. Mọi request tới các route cần bảo vệ PHẢI đính kèm token trong header: `Authorization: Bearer <token>`

### 4.2. Middleware `verifyToken.js` — bắt buộc áp dụng cho MỌI route trừ `/auth/login`, `/auth/register`

```js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token không tồn tại' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    req.user = { id: decoded.id, email: decoded.email }; // gán vào req, KHÔNG query lại DB
    next();
  });
}

module.exports = verifyToken;
```

**Quy định cứng:**

- `JWT_SECRET` PHẢI được load từ biến môi trường. Nếu thiếu → **throw error khi khởi động server**, không dùng giá trị fallback hardcode.
- Token hết hạn sau 8 giờ (`expiresIn: '8h'`).
- Mọi route sau khi qua `verifyToken` phải dùng `req.user.id` để lọc dữ liệu — KHÔNG bao giờ tin `user_id` gửi từ client (body/query/param) để xác định chủ sở hữu dữ liệu. Đây là lỗi IDOR phổ biến, phải tránh tuyệt đối.

Ví dụ đúng vs sai:

```js
// SAI — tin user_id từ client, hacker có thể sửa để xem data người khác
const transactions = await Transaction.findByUserId(req.body.user_id);

// ĐÚNG — luôn lấy từ req.user do middleware xác thực gán
const transactions = await Transaction.findByUserId(req.user.id);
```

---

## 5. CHỐNG SQL INJECTION — BẮT BUỘC

**Cấm tuyệt đối** nối chuỗi SQL trực tiếp với input từ client. Mọi query PHẢI dùng parameterized query (prepared statement).

```js
// SAI — dính SQL Injection, hacker nhập admin' -- hoặc ' OR 1=1 -- sẽ bypass được
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
db.query(query);

// ĐÚNG — dùng dấu ? (mysql2/mysql driver) để tham số hóa
const [rows] = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

**Quy tắc bổ sung cho login:**

- KHÔNG BAO GIỜ so sánh password trực tiếp trong câu SQL (`WHERE password = ?`). Query chỉ lấy user theo `email`, sau đó so sánh password bằng `bcrypt.compare()` ở tầng code.
- Mật khẩu lưu DB phải hash bằng `bcrypt` (salt rounds ≥ 10), không lưu plaintext.

```js
// Luồng login đúng
const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
if (rows.length === 0) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });

const isMatch = await bcrypt.compare(password, rows[0].password_hash);
if (!isMatch) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
```

- Nếu dùng ORM (Sequelize/Prisma) thay vì raw query: mặc định các ORM này đã tham số hóa, nhưng KHÔNG được dùng raw query mode (`sequelize.query` với nối chuỗi) cho input từ user.

---

## 6. CÁC BIỆN PHÁP BẢO MẬT KHÁC (áp dụng ở app level)

| Biện pháp            | Công cụ                                                                                                                                       | Mục đích                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP headers bảo mật | `helmet`                                                                                                                                      | Chống clickjacking, XSS cơ bản, ẩn thông tin server                                                                                 |
| Rate limiting          | `express-rate-limit`                                                                                                                          | Chống brute-force login, chống DDoS đơn giản. Áp riêng cho`/api/auth/login` với giới hạn chặt hơn (VD: 5 lần/15 phút/IP) |
| CORS                   | `cors`                                                                                                                                        | Chỉ cho phép origin của frontend, không để`origin: '*'` khi có auth                                                             |
| Input validation       | `express-validator` hoặc `Joi`                                                                                                             | Validate kiểu dữ liệu, độ dài, format trước khi vào controller                                                                  |
| Sanitize output        | Escape khi render (React tự làm)                                                                                                              | Chống XSS                                                                                                                               |
| File upload            | `multer` (memoryStorage) giới hạn size + kiểm tra mimetype ảnh, upload thẳng lên Cloudinary — không lưu file tạm trên đĩa server | Chống upload file độc hại giả dạng ảnh, tránh phình dung lượng server                                                         |
| Secrets                | `.env` + `.gitignore`                                                                                                                       | Không commit JWT_SECRET, DB password, API key lên Git                                                                                  |
| HTTPS                  | Bắt buộc khi deploy                                                                                                                           | Bảo vệ token không bị đánh cắp qua mạng                                                                                          |
| Error message          | Không lộ chi tiết lỗi hệ thống ra client (VD: SQL error)                                                                                  | Tránh lộ cấu trúc DB cho attacker                                                                                                    |

**Cấu hình `helmet` + `rate-limit` mẫu:**

```js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút' }
});
app.use('/api/auth/login', loginLimiter);
```

---

## 7. QUY CHUẨN UI/UX ĐỒNG BỘ

Agent phải đảm bảo tính nhất quán xuyên suốt toàn bộ giao diện:

### 7.1. Design tokens — định nghĩa 1 lần, dùng lại mọi nơi

- Tạo file biến màu/spacing tập trung (VD: `tailwind.config.js` extend theme, hoặc CSS variables trong `index.css`)
- **Trước khi hardcode màu ở bất kỳ component nào, đọc lại file theme trước.** Không dùng mã màu tùy tiện rải rác trong từng component.

### 7.2. Bảng màu chủ đạo — TRẮNG & XANH DƯƠNG (quyết định cuối, không tự đổi)

- **Nền chính:** trắng (`#FFFFFF`) — giữ giao diện sạch, sáng, đúng tinh thần app tài chính hiện đại
- **Primary (xanh dương):** dùng cho nút hành động chính, active state, link, biểu đồ chính. Gợi ý sắc độ: `#2563EB` (xanh dương chuẩn, dễ đọc) hoặc `#1E40AF` (đậm hơn cho text/icon quan trọng) — agent đề xuất bảng màu cụ thể (bao gồm các sắc độ nhạt/đậm dùng cho hover, disabled, background nhạt) theo quy trình mục 0.1 trước khi code UI, kèm hình minh họa palette để duyệt
- **Success (thu nhập):** xanh lá, chỉ dùng làm màu phụ để phân biệt thu/chi, không lấn át tông trắng-xanh dương chủ đạo
- **Danger (vượt ngân sách):** đỏ/cam, dùng tiết chế, chỉ ở cảnh báo/badge
- **Neutral:** xám nhạt cho border, xám đậm cho text phụ, tránh dùng màu đen thuần (`#000000`) cho text để đỡ gắt mắt trên nền trắng

### 7.3. Component tái sử dụng bắt buộc dùng chung

- `Button`, `Input`, `Modal`, `Card`, `Badge` — định nghĩa 1 lần trong `components/common/`, mọi nơi khác import lại, KHÔNG viết lại button riêng cho từng page.
- 1 `ConfirmModal` dùng chung cho mọi hành động xóa/xác nhận quan trọng — không dùng `window.confirm()`.

### 7.4. Typography & spacing

- Chọn 1 font chính (VD: Inter, Be Vietnam Pro) áp dụng toàn app qua Tailwind config, không để mỗi trang 1 font khác nhau
- Dùng thang spacing chuẩn của Tailwind (4, 8, 12, 16, 24px...), tránh giá trị tùy ý như `13px`, `27px`

### 7.5. Trạng thái loading/error đồng bộ

- Component loading (spinner/skeleton) dùng chung 1 kiểu cho toàn app
- Thông báo lỗi/thành công dùng chung 1 hệ thống toast (VD: `react-hot-toast`), không tự viết alert riêng lẻ từng chỗ

### 7.6. Responsive

- Thiết kế mobile-first, vì sinh viên chủ yếu dùng điện thoại để ghi chi tiêu (đặc biệt tính năng chụp ảnh hóa đơn)

---

## 8. QUY ƯỚC CODE CHUNG

- Đặt tên file: `camelCase.js` cho file thường, `PascalCase.jsx` cho React component
- Mỗi hàm controller PHẢI có try/catch, lỗi đẩy qua `next(err)` để `errorHandler` xử lý tập trung, không tự viết `res.status(500)` rải rác từng nơi
- Response API luôn theo format thống nhất:

```json
{ "success": true, "data": {...}, "message": "..." }
```

- Không viết business logic trong route file — route chỉ map path tới controller
- Mọi biến môi trường (DB credentials, JWT_SECRET, API key AI) đọc từ `.env`, có file `.env.example` mẫu (không chứa giá trị thật) commit lên Git

---

## 9. THỨ TỰ TRIỂN KHAI ĐỀ XUẤT CHO AGENT

1. Setup project (frontend + backend), cấu hình `.env`, kết nối MySQL
2. Auth module hoàn chỉnh (register/login, middleware verifyToken, bcrypt, JWT) — TEST kỹ SQL injection và bypass token trước khi qua bước sau
3. CRUD categories, income sources
4. CRUD transactions (nhập tay)
5. Dashboard cơ bản (tổng thu/chi, biểu đồ)
6. Budget module + cảnh báo
7. OCR + AI categorization (receipt upload flow)
8. Forecast service + insight service
9. Polish UI/UX đồng bộ theo mục 7
10. Viết `.env.example`, README hướng dẫn chạy local, test toàn bộ luồng bảo mật lần cuối

---

## 10. CHECKLIST BẢO MẬT TRƯỚC KHI COI LÀ "XONG"

- [ ] Không route nào (trừ auth) thiếu `verifyToken`
- [ ] Không câu SQL nào nối chuỗi trực tiếp với input
- [ ] Password luôn hash bcrypt, không có nơi nào lưu/so sánh plaintext
- [ ] JWT_SECRET không hardcode, throw lỗi nếu thiếu khi khởi động
- [ ] Không route nào tin `user_id`/`role` gửi từ client body/query để phân quyền
- [ ] `.env` nằm trong `.gitignore`
- [ ] Rate limit đã áp cho route login
- [ ] Helmet + CORS đã cấu hình đúng origin
- [ ] File upload giới hạn size + kiểm tra type, KHÔNG lưu ảnh trong MySQL, chỉ lưu URL Cloudinary
- [ ] Biến `CLOUDINARY_*` nằm trong `.env`, không hardcode
- [ ] Lỗi hệ thống không lộ ra response cho client
