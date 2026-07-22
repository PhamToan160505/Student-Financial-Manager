---
name: qlsv-finance-backend-patterns
description: "Chuẩn kiến trúc & bảo mật backend Node.js/Express cho web quản lý tài chính sinh viên (MVC, JWT, chống SQL Injection, Groq AI). LUÔN dùng skill này khi viết/sửa bất kỳ route, controller, model, middleware, hoặc service nào ở backend — kể cả khi user chỉ nói 'thêm API cho X' mà không nhắc rõ bảo mật hay kiến trúc. Đây là chuẩn bắt buộc, không phải gợi ý tùy chọn."
risk: safe
source: project-specific
date_added: "2026-07-22"
---
# Backend Patterns — Web Tài Chính Sinh Viên

Chuẩn bắt buộc khi code bất kỳ phần backend nào của dự án. Không tự ý đổi kiến trúc hay bỏ qua bước bảo mật nào dưới đây.

## 1. Kiến trúc MVC bắt buộc

```
backend/
├── server.js          # CHỈ mount middleware + routes, KHÔNG viết logic route trực tiếp
├── config/             # db.js (connection pool), env.js (validate biến môi trường)
├── models/             # Thao tác DB — luôn dùng parameterized query
├── controllers/        # Nhận req, gọi model/service, trả response chuẩn hóa
├── routes/              # Mỗi resource 1 file, mount vào server.js
├── services/            # Business logic phức tạp, AI (ocr/categorization/forecast/insight)
├── middleware/          # verifyToken, validateRequest, errorHandler, rateLimiter
└── utils/               # response.js chuẩn hóa {success, data, message}
```

**Cấm:** viết `app.get(...)`/`app.post(...)` trực tiếp trong `server.js` (trừ health-check). Mỗi resource phải có đủ 4 lớp: route → controller → model/service.

## 2. Quy trình bắt buộc trước khi code (áp dụng cho MỌI API mới)

Trước khi viết route/controller mới, PHẢI đưa đề xuất ngắn: mục tiêu API, request/response shape, file sẽ động vào, có cần transaction DB không — và chờ duyệt. Không code trước, báo cáo sau. (Chi tiết đầy đủ ở README chính, mục 0.)

## 3. Authentication — JWT bắt buộc cho mọi route trừ auth

```js
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token không tồn tại' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
    req.user = { id: decoded.id, email: decoded.email };
    next();
  });
}
```

- `JWT_SECRET` bắt buộc từ `.env`, throw error khi start server nếu thiếu — cấm giá trị fallback hardcode.
- Token hết hạn 8h.
- **Luật chống IDOR:** mọi query lọc dữ liệu theo user PHẢI dùng `req.user.id` (từ token đã verify), KHÔNG BAO GIỜ tin `user_id` gửi từ body/query/param của client.

```js
// SAI
const data = await Model.findByUserId(req.body.user_id);
// ĐÚNG
const data = await Model.findByUserId(req.user.id);
```

## 4. Chống SQL Injection — bắt buộc tuyệt đối

Cấm nối chuỗi SQL với input từ client trong mọi trường hợp.

```js
// SAI — dính injection kiểu ' OR 1=1 --
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ĐÚNG — parameterized query
const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
```

- Login: chỉ query theo `email`, so sánh password bằng `bcrypt.compare()` ở tầng code — không đưa password vào câu SQL.
- Password lưu DB luôn hash bcrypt (salt rounds ≥ 10).
- Nếu dùng ORM: không dùng raw-query mode nối chuỗi với input user.

## 5. Bảo mật app-level bắt buộc

| Biện pháp      | Công cụ                                                                                                                       | Áp dụng                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Security headers | `helmet`                                                                                                                      | Toàn app                                             |
| Rate limit login | `express-rate-limit`                                                                                                          | Riêng cho`/api/auth/login`, VD 5 lần/15 phút/IP  |
| CORS             | `cors`                                                                                                                        | Chỉ whitelist origin frontend, không`origin: '*'` |
| Validate input   | `express-validator`/`Joi`                                                                                                   | Mọi route nhận input                                |
| File upload      | `multer` (memoryStorage) giới hạn size + check mimetype, upload thẳng lên Cloudinary — không lưu file tạm trên đĩa | Route upload hóa đơn                               |
| Secrets          | `.env` + `.gitignore`                                                                                                       | Không commit key/secret                              |
| Error response   | Không lộ chi tiết lỗi SQL/hệ thống ra client                                                                              | Qua`errorHandler` tập trung                        |

## 6. Lưu trữ ảnh hóa đơn — Cloudinary (bắt buộc, KHÔNG lưu ảnh trong MySQL)

- DB chỉ lưu `image_url` (secure_url từ Cloudinary) + `cloudinary_public_id` (dùng để xóa khi cần), không dùng cột `BLOB`.
- Luồng: `multer` (memoryStorage) nhận buffer → upload buffer lên Cloudinary bằng SDK `cloudinary` → lưu `secure_url`/`public_id` vào bảng `receipts`.
- Biến `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `.env`, không hardcode.
- Giới hạn 5MB/file, chỉ nhận `image/jpeg|png|webp`, tổ chức folder `qlsv-finance/receipts/` trên Cloudinary.
- Khi xóa giao dịch có ảnh, gọi `cloudinary.uploader.destroy(public_id)` để dọn quota free tier.
- Chi tiết đầy đủ ở README chính, mục 3.4.

## 7. Tích hợp AI — dùng Groq (free tier)

- Text tasks (categorization, insight generation, chuẩn hóa dữ liệu từ OCR thô) dùng Groq model **`openai/gpt-oss-120b`** (KHÔNG dùng `llama-3.3-70b-versatile` — model này đã bị Groq deprecate, tắt hoàn toàn 16/8/2026).
- **Groq có thể KHÔNG có model vision ổn định miễn phí** để đọc ảnh hóa đơn trực tiếp. Trước khi code `ocrService`, phải đề xuất rõ hướng xử lý ảnh (Tesseract.js local + Groq xử lý text sau, hoặc API vision free riêng) và chờ duyệt — không tự chọn hướng rồi code luôn.
- Tách AI logic vào `services/`, KHÔNG viết trực tiếp trong controller.
- `forecastService` (dự báo dòng tiền) là tính toán thống kê thuần (trung bình chi/ngày, projection), KHÔNG cần gọi AI — tiết kiệm token và dễ giải thích khi phỏng vấn.

## 8. Response format chuẩn hóa

```json
{ "success": true, "data": {}, "message": "..." }
```

Mọi controller dùng try/catch, đẩy lỗi qua `next(err)` cho `errorHandler` xử lý tập trung — không tự viết `res.status(500)` rải rác từng route.

## 9. Checklist tự kiểm tra sau khi code xong 1 API

- [ ] Route có `verifyToken` (trừ auth)?
- [ ] Không câu SQL nào nối chuỗi input?
- [ ] Query lọc theo `req.user.id`, không tin `user_id` từ client?
- [ ] Input đã validate trước khi vào controller?
- [ ] Response đúng format chuẩn `{success, data, message}`?
- [ ] Lỗi không lộ chi tiết hệ thống ra ngoài?
- [ ] Ảnh (nếu có) lưu qua Cloudinary, DB chỉ lưu URL — không lưu BLO

---
name: qlsv-finance-backend-patterns
description: "Chuẩn kiến trúc & bảo mật backend Node.js/Express cho web quản lý tài chính sinh viên (MVC, JWT, chống SQL Injection, Groq AI). LUÔN dùng skill này khi viết/sửa bất kỳ route, controller, model, middleware, hoặc service nào ở backend — kể cả khi user chỉ nói 'thêm API cho X' mà không nhắc rõ bảo mật hay kiến trúc. Đây là chuẩn bắt buộc, không phải gợi ý tùy chọn."
risk: safe
source: project-specific
date_added: "2026-07-22"
---
# Backend Patterns — Web Tài Chính Sinh Viên

Chuẩn bắt buộc khi code bất kỳ phần backend nào của dự án. Không tự ý đổi kiến trúc hay bỏ qua bước bảo mật nào dưới đây.

## 1. Kiến trúc MVC bắt buộc

```
backend/
├── server.js          # CHỈ mount middleware + routes, KHÔNG viết logic route trực tiếp
├── config/             # db.js (connection pool), env.js (validate biến môi trường)
├── models/             # Thao tác DB — luôn dùng parameterized query
├── controllers/        # Nhận req, gọi model/service, trả response chuẩn hóa
├── routes/              # Mỗi resource 1 file, mount vào server.js
├── services/            # Business logic phức tạp, AI (ocr/categorization/forecast/insight)
├── middleware/          # verifyToken, validateRequest, errorHandler, rateLimiter
└── utils/               # response.js chuẩn hóa {success, data, message}
```

**Cấm:** viết `app.get(...)`/`app.post(...)` trực tiếp trong `server.js` (trừ health-check). Mỗi resource phải có đủ 4 lớp: route → controller → model/service.

## 2. Quy trình bắt buộc trước khi code (áp dụng cho MỌI API mới)

Trước khi viết route/controller mới, PHẢI đưa đề xuất ngắn: mục tiêu API, request/response shape, file sẽ động vào, có cần transaction DB không — và chờ duyệt. Không code trước, báo cáo sau. (Chi tiết đầy đủ ở README chính, mục 0.)

## 3. Authentication — JWT bắt buộc cho mọi route trừ auth

```js
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token không tồn tại' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
    req.user = { id: decoded.id, email: decoded.email };
    next();
  });
}
```

- `JWT_SECRET` bắt buộc từ `.env`, throw error khi start server nếu thiếu — cấm giá trị fallback hardcode.
- Token hết hạn 8h.
- **Luật chống IDOR:** mọi query lọc dữ liệu theo user PHẢI dùng `req.user.id` (từ token đã verify), KHÔNG BAO GIỜ tin `user_id` gửi từ body/query/param của client.

```js
// SAI
const data = await Model.findByUserId(req.body.user_id);
// ĐÚNG
const data = await Model.findByUserId(req.user.id);
```

## 4. Chống SQL Injection — bắt buộc tuyệt đối

Cấm nối chuỗi SQL với input từ client trong mọi trường hợp.

```js
// SAI — dính injection kiểu ' OR 1=1 --
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ĐÚNG — parameterized query
const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
```

- Login: chỉ query theo `email`, so sánh password bằng `bcrypt.compare()` ở tầng code — không đưa password vào câu SQL.
- Password lưu DB luôn hash bcrypt (salt rounds ≥ 10).
- Nếu dùng ORM: không dùng raw-query mode nối chuỗi với input user.

## 5. Bảo mật app-level bắt buộc

| Biện pháp      | Công cụ                                                                                                                       | Áp dụng                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Security headers | `helmet`                                                                                                                      | Toàn app                                             |
| Rate limit login | `express-rate-limit`                                                                                                          | Riêng cho`/api/auth/login`, VD 5 lần/15 phút/IP  |
| CORS             | `cors`                                                                                                                        | Chỉ whitelist origin frontend, không`origin: '*'` |
| Validate input   | `express-validator`/`Joi`                                                                                                   | Mọi route nhận input                                |
| File upload      | `multer` (memoryStorage) giới hạn size + check mimetype, upload thẳng lên Cloudinary — không lưu file tạm trên đĩa | Route upload hóa đơn                               |
| Secrets          | `.env` + `.gitignore`                                                                                                       | Không commit key/secret                              |
| Error response   | Không lộ chi tiết lỗi SQL/hệ thống ra client                                                                              | Qua`errorHandler` tập trung                        |

## 6. Lưu trữ ảnh hóa đơn — Cloudinary (bắt buộc, KHÔNG lưu ảnh trong MySQL)

- DB chỉ lưu `image_url` (secure_url từ Cloudinary) + `cloudinary_public_id` (dùng để xóa khi cần), không dùng cột `BLOB`.
- Luồng: `multer` (memoryStorage) nhận buffer → upload buffer lên Cloudinary bằng SDK `cloudinary` → lưu `secure_url`/`public_id` vào bảng `receipts`.
- Biến `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `.env`, không hardcode.
- Giới hạn 5MB/file, chỉ nhận `image/jpeg|png|webp`, tổ chức folder `qlsv-finance/receipts/` trên Cloudinary.
- Khi xóa giao dịch có ảnh, gọi `cloudinary.uploader.destroy(public_id)` để dọn quota free tier.
- Chi tiết đầy đủ ở README chính, mục 3.4.

## 7. Tích hợp AI — dùng Groq (free tier)

- Text tasks (categorization, insight generation, chuẩn hóa dữ liệu từ OCR thô) dùng Groq (**bắt buộc dùng model `openai/gpt-oss-120b`**, tuyệt đối không dùng `llama-3.3-70b-versatile` vì đã bị Groq deprecate từ 16/8/2026 theo Mục 3.3 README.md).
- **Groq có thể KHÔNG có model vision ổn định miễn phí** để đọc ảnh hóa đơn trực tiếp. Trước khi code `ocrService`, phải đề xuất rõ hướng xử lý ảnh (Tesseract.js local + Groq xử lý text sau, hoặc API vision free riêng) và chờ duyệt — không tự chọn hướng rồi code luôn.
- Tách AI logic vào `services/`, KHÔNG viết trực tiếp trong controller.
- `forecastService` (dự báo dòng tiền) là tính toán thống kê thuần (trung bình chi/ngày, projection), KHÔNG cần gọi AI — tiết kiệm token và dễ giải thích khi phỏng vấn.

## 8. Response format chuẩn hóa

```json
{ "success": true, "data": {}, "message": "..." }
```

Mọi controller dùng try/catch, đẩy lỗi qua `next(err)` cho `errorHandler` xử lý tập trung — không tự viết `res.status(500)` rải rác từng route.

## 9. Checklist tự kiểm tra sau khi code xong 1 API

- [ ] Route có `verifyToken` (trừ auth)?
- [ ] Không câu SQL nào nối chuỗi input?
- [ ] Query lọc theo `req.user.id`, không tin `user_id` từ client?
- [ ] Input đã validate trước khi vào controller?
- [ ] Response đúng format chuẩn `{success, data, message}`?
- [ ] Lỗi không lộ chi tiết hệ thống ra ngoài?
- [ ] Ảnh (nếu có) lưu qua Cloudinary, DB chỉ lưu URL — không lưu BLOB?
