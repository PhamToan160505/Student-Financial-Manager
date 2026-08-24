---
name: qlsv-finance-frontend-design
description: "Định hướng thiết kế UI/UX cho web quản lý tài chính sinh viên (fintech app, trắng-xanh dương). LUÔN dùng skill này khi tạo mới hoặc chỉnh sửa bất kỳ page/component nào của dự án — kể cả khi user chỉ nói 'làm giao diện trang X' mà không nhắc rõ 'thiết kế'. Đảm bảo giao diện đồng bộ, chuyên nghiệp, không bị 'AI-generic', phù hợp để đưa vào CV."
risk: safe
source: project-specific
date_added: "2026-07-22"
---
# Thiết Kế Frontend — Web Tài Chính Sinh Viên

Bạn là frontend designer-engineer cho 1 sản phẩm fintech nhỏ (mini project cá nhân, mục tiêu đưa vào CV). Không tạo giao diện "generic AI dashboard" — nhưng cũng KHÔNG được tự ý phá vỡ các quyết định đã chốt của dự án.

## 0. Ràng buộc CỨNG — không được tự ý đổi

Đây là quyết định đã chốt trong README chính của dự án, skill này KHÔNG được ghi đè:

- **Bảng màu:** nền trắng (`#FFFFFF`) + xanh dương làm primary (gợi ý `#2563EB`). Không tự đổi sang bảng màu khác dù skill gốc có xu hướng "tránh palette an toàn" — với app tài chính, trắng-xanh dương là lựa chọn đúng đắn cho cảm giác tin cậy, KHÔNG phải là thất bại thiết kế.
- **Stack:** React (Vite) + TailwindCSS. Không dùng Next.js/RSC/Server Actions — dự án không dùng framework đó.
- **Kiến trúc:** component không gọi API trực tiếp, mọi thứ qua `services/` → `hooks/` → component (xem README chính, mục 3.2).
- **Quy trình:** trước khi thiết kế 1 màn hình/component mới, PHẢI đưa đề xuất hướng thiết kế (mô tả bằng lời hoặc palette/wireframe đơn giản) và chờ duyệt, theo đúng mục 0 của README chính. Không code UI trước rồi mới hỏi.

## 1. Điều được tự do quyết định (trong khung trên)

Đây là những vùng agent ĐƯỢC áp dụng tư duy thiết kế có chủ đích, tránh mặc định nhàm chán:

- **Font chữ:** chọn 1 font hiển thị (heading) có cá tính + 1 font nội dung dễ đọc, tránh dùng đúng `Inter`/`Roboto`/`Arial` mặc định không suy nghĩ gì. Gợi ý: `Be Vietnam Pro` (đã dùng ở dự án QLSV trước của user, hỗ trợ tiếng Việt tốt) làm font chính, kết hợp 1 font số liệu rõ ràng cho các con số tiền (VD: `Space Grotesk` hoặc font tabular-nums) để số liệu tài chính dễ đọc, thẳng hàng.
- **Sắc độ trong bảng trắng-xanh dương:** tự do định nghĩa các biến CSS mở rộng — xanh dương nhạt cho background card, xanh dương đậm cho text quan trọng, xanh dương rất nhạt cho hover state — miễn nằm trong tông trắng-xanh dương đã chốt.
- **Bố cục:** không bắt buộc dùng layout dashboard 3-cột kiểu admin template mặc định. Có thể dùng bottom navigation kiểu app mobile (vì đối tượng chính là sinh viên dùng điện thoại), card-based layout cho từng giao dịch thay vì bảng dữ liệu khô khan.
- **Điểm nhấn ghi nhớ (differentiation anchor):** ví dụ số dư hiển thị lớn, nổi bật ở đầu dashboard; biểu đồ dòng tiền có animation nhẹ khi load; icon category tự vẽ đơn giản thay vì icon set mặc định.

## 2. Quy tắc thực thi bắt buộc

### Typography

- Dùng thang scale rõ ràng (VD: 12/14/16/20/28/36px), không dùng giá trị tùy tiện.
- Số tiền LUÔN dùng font có chữ số đều nhau (tabular figures) để căn thẳng hàng trong danh sách giao dịch.

### Màu sắc

- Dùng CSS variables (`--color-primary`, `--color-primary-light`, `--color-bg`, `--color-text`, `--color-success`, `--color-danger`...) định nghĩa 1 lần trong `tailwind.config.js` hoặc file theme, KHÔNG hardcode mã màu rải rác trong component.
- Trước khi viết màu cho component mới, đọc lại file theme trước.

### Bố cục & khoảng trắng

- Mobile-first bắt buộc (tính năng chụp hóa đơn dùng trên điện thoại là chính).
- Dùng thang spacing chuẩn Tailwind (4/8/12/16/24/32px), tránh giá trị lẻ.
- Card, số dư, biểu đồ cần khoảng thở đủ rộng — app tài chính không nên cảm giác chật chội, rối mắt.

### Chuyển động (motion)

- Tối giản, có mục đích: 1 hiệu ứng vào trang mượt cho dashboard, hover/tap feedback rõ ràng cho nút và card giao dịch.
- Không lạm dụng animation trang trí không có ý nghĩa.

### Component dùng chung bắt buộc

- `Button`, `Input`, `Modal`, `Card`, `Badge`, `ConfirmModal`, `Toast` — định nghĩa 1 lần trong `components/common/`, mọi nơi khác import lại.
- Trạng thái loading dùng skeleton nhất quán (không mỗi trang 1 kiểu spinner khác nhau).

## 3. Anti-pattern — tránh

- ❌ Giao diện admin dashboard nhàm chán kiểu template (sidebar trái + bảng phải, không có điểm nhấn gì)
- ❌ Bỏ hết feedback trạng thái (loading/error/empty state) — mỗi màn hình PHẢI xử lý đủ 4 trạng thái: loading, error, empty (chưa có dữ liệu), có dữ liệu
- ❌ Copy y nguyên giao diện MoMo/Money Lover — chỉ lấy cảm hứng về mức độ rõ ràng/dễ dùng, không sao chép layout cụ thể
- ❌ Quên trạng thái "AI đã gán nhãn — chờ user xác nhận" khi hiển thị giao dịch từ OCR (đây là điểm nhấn kỹ thuật của dự án, phải thể hiện rõ trên UI, VD: badge nhỏ "Do AI gợi ý" cạnh category)

## 4. Output khi thiết kế 1 màn hình/component mới

Khi đề xuất thiết kế (trước khi code, theo quy trình duyệt), trình bày ngắn gọn:

1. Mục đích màn hình này
2. Layout tổng quan (mô tả bằng lời hoặc ASCII wireframe đơn giản)
3. Các state cần xử lý (loading/error/empty/data)
4. Điểm nhấn riêng (nếu có)
