# Trình tạo chữ viết tay (Text2Handwriting)

> Chuyển đổi văn bản thông thường thành các trang chữ viết tay chân thực, chạy hoàn toàn trong trình duyệt mà không tải lên máy chủ.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · **Tiếng Việt** · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Dùng thử trực tuyến](https://shouxie.newzone.top)

![Xem trước giao diện: dán văn bản bên trái, tạo bản viết tay bên phải](../images/hero-en.png)

Được thiết kế cho bài tập về nhà viết tay, nhật ký đọc sách, biên bản cuộc họp và thư từ trang trọng. Khác với các công cụ thông thường chỉ đổi phông chữ một cách máy móc, Text2Handwriting áp dụng các nhiễu loạn giả ngẫu nhiên có hạt giống kiểm soát lên kích thước chữ, góc xoay, độ rung đường cơ sở và mật độ mực. Ứng dụng chạy hoàn toàn trong trình duyệt của bạn mà không cần tài khoản hay tải dữ liệu lên máy chủ.

## Ma trận tương thích

| Hạng mục | Chi tiết |
|---|---|
| Môi trường | Trình duyệt hiện đại trên máy tính và thiết bị di động, 100% phía máy khách (Chrome và Edge 103+ có thể liệt kê phông chữ cục bộ, Safari và Firefox sử dụng nhận diện tích hợp) |
| Định dạng nhập | Dán văn bản trực tiếp, tải lên tệp `.txt` / `.md` (kiểm tra nghiêm ngặt UTF-8 với dự phòng GB18030) hoặc tệp `.docx` (trích xuất nội dung phía máy khách) |
| Kiểu giấy | 6 loại giấy tích hợp (vở kẻ ngang, ô kẻ caro, A4 trắng, 4 dòng kẻ tiếng Anh, giấy kraft, lưới chấm dot) và hỗ trợ tải lên ảnh giấy tùy chỉnh có tự động căn chỉnh |
| Bút và hiệu ứng | 4 cơ chế vật lý của nét bút (bút gel, bút máy, bút chì, bút bi); ánh sáng tán xạ môi trường, bóng nếp gấp giấy, hiệu ứng mờ góc và giấy cũ |
| Tùy chọn xuất | Xuất trang hiện tại thành PNG / JPG, toàn bộ trang dạng nén ZIP, tệp PDF nhiều trang và in không mất dữ liệu theo milimét thực tế qua iframe ẩn (lên đến ~435 DPI) |
| Kiểu chữ và dàn trang | Giao diện hỗ trợ đầy đủ 18 ngôn ngữ; ngắt dòng thông minh, quy tắc dấu câu CJK, bố cục hai chiều tiếng Ả Rập (BiDi RTL) với liên kết nét tự nhiên |
| Ngoại tuyến và đồng bộ | Ứng dụng web tiến bộ (PWA) cài đặt được; bảo vệ xung đột giữa các tab bằng Web Locks, tự động lưu bản nháp mỗi 250ms và cảnh báo trước khi đóng |

## Tính năng nổi bật

- **Chữ viết tay chân thực**: Nhiễu loạn giả ngẫu nhiên do hạt giống điều khiển giúp tinh chỉnh kích thước chữ, khoảng cách, độ nghiêng, độ lệch đường cơ sở, độ đậm nhạt và cảm giác mỏi tay khi viết. Mỗi lần kết xuất đều độc nhất và lưu lại hạt giống cho phép tái tạo chính xác 100% cùng một kết quả.
- **Dàn trang thông minh & văn bản hai chiều**: Bản địa hóa hoàn chỉnh cho 18 ngôn ngữ; quy tắc đầu/cuối dòng CJK, thụt đầu dòng đoạn văn, tự động phân trang và căn phải chữ ký; bảo vệ ngắt từ cho chữ cái Latinh; hỗ trợ chữ viết Ả Rập liền nét tự nhiên cùng bảo vệ dấu ngoặc.
- **Kết cấu giấy & ảnh chụp**: Tùy chỉnh chi tiết khoảng cách dòng và lề trang; lưới ô vuông tỉ lệ chuẩn; tự động căn ảnh chụp tải lên vừa vặn khổ A4; đổ bóng nếp gấp và ánh sáng chân thực.
- **Tùy biến phông chữ**: Tích hợp sẵn 4 phông chữ viết tay mã nguồn mở (sẵn sàng dùng 100% ngoại tuyến). Tải phông chữ hệ thống, Google Fonts hoặc kéo thả tệp `.ttf` / `.otf` (tương thích với Calligraphr để dùng nét chữ của chính bạn).
- **Chỉnh sửa & gạch xóa tự nhiên**: 13 kiểu gạch xóa (nét đơn, nét đôi, lượn sóng, gạch nguệch ngoạc) với xác suất tùy chỉnh; gạch lỗi và viết từ sửa phía trên dòng; lớp vẽ tự do tích hợp để thêm mũi tên và ghi chú.
- **Hình mẫu chữ viết**: 4 thiết lập sẵn chỉ bằng một cú nhấp (học sinh chăm chỉ, ghi chú nhanh, bản thảo vội vàng, bản sao trang trọng) giúp cài đặt ngay loại bút và khoảng cách.

## Cú pháp đánh dấu

Sử dụng các thẻ đánh dấu nội dòng trực tiếp trong văn bản để chỉ định chính xác các nét gạch xóa và vùng làm nổi bật:

| Cú pháp | Hiệu ứng hiển thị |
|---|---|
| `~~từ sai~~` hoặc `[del]từ sai[/del]` | Gạch xóa văn bản |
| `[del:từ sửa]từ sai[/del]` | Gạch xóa từ sai và viết từ sửa ở phía trên dòng |
| `[u]nổi bật[/u]` | Gạch chân lượn sóng |
| `[circle]nổi bật[/circle]` | Khoanh tròn văn bản (tên viết tắt `[圈]…[/圈]`) |
| `[box]nổi bật[/box]` | Đóng khung hộp quanh văn bản (tên viết tắt `[框]…[/框]`) |

## Bắt đầu nhanh

1. Mở [bản dùng thử trực tuyến](https://shouxie.newzone.top) hoặc nhập tệp văn bản (`.txt` / `.docx` / `.md`).
2. Chọn kiểu giấy, phông chữ viết tay và phong cách viết từ bảng điều khiển bên trái.
3. Nhấp vào "Xuất" trên thanh tiêu đề phía trên để tải xuống hình ảnh độ phân giải cao, tệp PDF hoặc gửi trực tiếp tới máy in.

## Giới hạn đã biết

- Dàn trang chữ Latinh và CJK sử dụng ước tính độ rộng ký tự để đảm bảo tốc độ phản hồi tức thì trên các tài liệu dài hàng trăm trang (tiếng Ả Rập sử dụng phép đo Canvas gốc); với các phông chữ viết tay quá khác biệt, điểm kết thúc dòng có thể chênh lệch nhẹ.
- Tính năng in của trình duyệt chỉ in trang đang xem hiện tại; vui lòng sử dụng tính năng xuất PDF để in toàn bộ tài liệu nhiều trang.
- Trên trình duyệt Safari phiên bản thấp hơn 16, việc thiếu hỗ trợ `ctx.filter` sẽ làm các thanh trượt điều chỉnh độ sáng và tương phản của ảnh nền không hoạt động.
- Lớp vẽ tay tự do gắn liền với chỉ số trang trong bộ nhớ; các chỉnh sửa văn bản lớn làm thay đổi số trang có thể làm dịch chuyển vị trí các nét vẽ.
- Các tệp phông chữ tải lên cục bộ chỉ lưu tạm trong bộ nhớ phiên làm việc hiện tại và cần chọn lại sau khi tải lại trang.

## Phát triển cục bộ

Yêu cầu môi trường Node.js **22.12+ / 24+ / 26+**:

```bash
npm install
npm run dev        # khởi chạy máy chủ phát triển cục bộ tại http://localhost:5173/
npm test           # chạy bộ kiểm thử đơn vị Vitest
npm run lint       # phân tích mã tĩnh (oxlint)
npm run build      # đóng gói bản phát hành sản phẩm (tsc + vite)
```

Tập tin biên dịch trong thư mục `dist/` sử dụng đường dẫn tương đối (`base: './'`) và có thể được triển khai trên GitHub Pages hoặc bất kỳ máy chủ web nào. Xem chi tiết cấu trúc tại [docs/development.md](../development.md).

## Giấy phép

- **Mã nguồn**: Giấy phép MIT, xem [LICENSE](../../LICENSE)
- **Phông chữ**: Các phông chữ đi kèm trong thư mục `public/fonts/` được cấp phép theo SIL Open Font License (OFL), xem [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Dự án này là một sản phẩm độc lập và không có bất kỳ mối liên hệ nào với các công cụ tạo chữ viết tay của bên thứ ba.

## Giới thiệu về 365 Open Source Plan

Dự án **#039** của [365 Open Source Plan](https://github.com/rockbenben/365opensource) — một người + AI, hơn 300 dự án mã nguồn mở trong một năm.

[Gửi ý tưởng của bạn →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
