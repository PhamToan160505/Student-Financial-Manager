---
name: qlsv-finance-react-frontend
description: "Chuẩn viết code React (Vite, không dùng Next.js) cho web quản lý tài chính sinh viên — kiến trúc MVC phía client (services/hooks/pages/components), state management, gọi API, xử lý form/upload ảnh hóa đơn. LUÔN dùng skill này khi viết/sửa bất kỳ page, component, hook, hoặc service gọi API nào ở frontend, kể cả khi user chỉ nói 'làm trang X' hoặc 'thêm nút Y' mà không nhắc rõ kiến trúc."
risk: safe
source: project-specific
date_added: "2026-07-22"
---

# React Frontend Patterns — Web Tài Chính Sinh Viên

Dự án dùng **React thuần (Vite)**, KHÔNG dùng Next.js/App Router/Server Components/Server Actions. Nếu có kiến thức Next.js liên quan, bỏ qua — không áp dụng nhầm sang dự án này.

## 1. Kiến trúc MVC phía client — bắt buộc

```
frontend/src/
├── pages/        # View chính, map theo route UI (LoginPage, DashboardPage, TransactionsPage...)
├── components/    # View con tái sử dụng, KHÔNG gọi API trực tiếp
│   ├── common/    # Button, Input, Modal, Card, Badge, ConfirmModal, Toast — dùng chung toàn app
│   └── <feature>/ # Component riêng theo tính năng (transaction/, budget/, dashboard/)
├── hooks/         # "Controller" — custom hook điều phối logic + gọi service
├── services/      # "Model" tầng gọi API — MỌI request đi qua đây
│   ├── api.js      # axios instance chung, gắn interceptor JWT vào header
│   └── <resource>.service.js
├── context/       # AuthContext quản lý state đăng nhập toàn cục
└── utils/         # formatCurrency.js, v.v.
```

**Luật cứng:** Component KHÔNG được gọi `fetch`/`axios` trực tiếp. Luồng bắt buộc: `component` → gọi `hook` (VD: `useTransactions()`) → hook gọi `service` (VD: `transactionService.getAll()`) → service gọi `api.js`.

## 2. Quy trình bắt buộc trước khi code

Trước khi tạo page/component mới hoặc đổi luồng dữ liệu hiện có, đưa đề xuất ngắn (mục đích, component/hook/service sẽ động vào, cách xử lý state) và chờ duyệt — theo README chính mục 0. Không code trước.

## 3. Gọi API & xử lý JWT

`services/api.js` — 1 axios instance duy nhất, dùng interceptor để tự gắn token, KHÔNG gắn token thủ công ở từng service:

```js
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // hoặc lấy từ AuthContext
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      // token hết hạn/invalid → logout, điều hướng về login
    }
    return Promise.reject(err);
  }
);

export default api;
```

## 4. State management

- State cục bộ của form/UI: `useState` bình thường, không over-engineer.
- State dùng chung nhiều nơi (auth, thông tin user): `Context API` (`AuthContext`) — dự án nhỏ, không cần Redux/Zustand.
- Dữ liệu từ server (transactions, budgets...): custom hook tự quản lý loading/error/data, ví dụ:

```js
function useTransactions(month) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    transactionService.getAll(month)
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [month]);

  return { data, loading, error, refetch: () => {/* ... */} };
}
```

Mọi page dùng data từ server đều phải xử lý đủ 3 trạng thái: `loading`, `error`, `data` (kèm case rỗng).

## 5. Xử lý upload ảnh hóa đơn (tính năng đặc thù)

- Dùng `<input type="file" accept="image/*" capture="environment">` để ưu tiên mở camera trên mobile.
- Preview ảnh trước khi gửi lên server.
- Gọi `receiptService.upload(file)` → hiển thị loading rõ ràng (vì có độ trễ do AI xử lý OCR) → khi có kết quả, hiển thị form xác nhận (merchant, số tiền, category do AI gợi ý) để user sửa trước khi lưu — KHÔNG tự động lưu thẳng kết quả AI.
- Badge/label rõ ràng "Do AI gợi ý" cho category được AI gán, đúng tinh thần audit trail của dự án (cột `nguon`).

## 6. Component dùng chung — không viết lại

`Button`, `Input`, `Modal`, `Card`, `Badge`, `ConfirmModal`, `Toast` định nghĩa 1 lần trong `components/common/`. Cấm dùng `window.confirm()`/`alert()` — luôn qua `ConfirmModal`/hệ thống toast chung.

## 7. Quy tắc code

- File component: `PascalCase.jsx`. Hook: `useXxx.js`. Service: `xxxService.js` hoặc `xxx.service.js`.
- Không đặt logic gọi API hoặc business logic phức tạp trực tiếp trong JSX của page — đẩy vào hook.
- Không dùng `localStorage`/`sessionStorage` bên trong Claude Artifacts nếu có làm demo/prototype riêng (không áp dụng cho code thật của dự án chạy ngoài Artifacts — ở đó `localStorage` cho token là bình thường).

## 8. Checklist tự kiểm tra sau khi code xong 1 page/feature

- [ ] Component không gọi axios/fetch trực tiếp?
- [ ] Đủ 3 trạng thái loading/error/data (+ case rỗng)?
- [ ] Dùng đúng component chung (`common/`), không viết lại button/modal riêng?
- [ ] Màu sắc lấy từ CSS variable/theme, không hardcode mã màu mới?
- [ ] Responsive tốt trên mobile (đặc biệt màn hình có upload ảnh)?
