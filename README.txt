NOVA LOCAL BRAND — WEBSITE DEMO LOCALSTORAGE

1. CHẠY WEBSITE
- Giải nén ZIP vào một thư mục.
- Mở thư mục bằng VS Code, cài extension Live Server.
- Chuột phải index.html > Open with Live Server để mở cửa hàng.
- Mở loginadmin.html để vào trang quản trị.

2. TÀI KHOẢN QUẢN TRỊ DEMO
- Tên đăng nhập: admin
- Mật khẩu: nova123

3. CHỨC NĂNG ADMIN
- Tổng quan số sản phẩm, đơn hàng, khách hàng, hàng sắp hết và đơn hàng gần đây.
- Quản lý sản phẩm: thêm, sửa, xóa, ẩn/hiện; mã, tên, loại, size, giá vốn, giá bán, tồn kho, URL ảnh và mô tả.
- Quản lý loại sản phẩm: thêm, sửa tên, ẩn/hiện và xóa (không xóa được loại còn sản phẩm).
- Phiếu nhập: tạo phiếu nháp, sửa phiếu trước khi hoàn thành; khi hoàn thành mới cập nhật giá vốn/tồn kho và khóa sửa.
- Phiếu xuất: lưu ngày, số lượng, tồn trước/sau và lý do; chặn xuất vượt tồn.
- Quản lý giá: xem giá vốn, giá bán, lợi nhuận/đơn vị, tỷ lệ lợi nhuận theo giá vốn và tổng hợp theo loại; sửa giá bán.
- Tồn kho: tìm theo mã/tên, cảnh báo sắp hết hàng, giá trị tồn, lọc lịch sử nhập/xuất theo khoảng ngày và xem tồn trước/sau.
- Đơn hàng: tìm theo mã/khách hàng, lọc trạng thái và khoảng ngày, xem chi tiết người nhận/địa chỉ/thanh toán/sản phẩm, cập nhật trạng thái.
- Khách hàng: tìm kiếm, khóa/mở khóa và đặt lại mật khẩu demo.
- Xuất báo cáo tồn kho, phiếu nhập và phiếu xuất ra XLSX qua thư viện SheetJS CDN; cần Internet. Nếu XLSX không tải được, báo cáo tồn kho có phương án CSV.

4. CHỨC NĂNG KHÁCH HÀNG
- Đăng ký, đăng nhập, đăng xuất; tài khoản bị khóa không đăng nhập được.
- Xem danh sách và chi tiết sản phẩm, tìm theo tên, lọc loại và khoảng giá.
- Thêm/xóa sản phẩm khỏi giỏ, tăng/giảm số lượng; giới hạn theo tồn kho.
- Chỉnh sửa thông tin cá nhân, lưu địa chỉ thường dùng, xem lịch sử đơn hàng.
- Đặt hàng sau khi đăng nhập; nhập/chọn địa chỉ giao hàng, chọn COD hoặc chuyển khoản, xem tổng tiền và tạo đơn.
- Khi đặt hàng, tồn kho giảm và lịch sử xuất kho được ghi lại.

5. DỮ LIỆU VÀ LƯU Ý
- Dữ liệu demo dùng localStorage của đúng trình duyệt và origin (ví dụ http://127.0.0.1:5501). Admin đăng nhập dùng sessionStorage.
- Mở cửa hàng và trang admin bằng cùng origin để hai trang đọc cùng bộ dữ liệu.
- Dữ liệu không đồng bộ giữa máy/trình duyệt và có thể mất nếu xóa dữ liệu site.
- Đây là đồ án front-end minh họa, không dùng để xử lý tài khoản hoặc dữ liệu khách hàng thật. Mật khẩu đang lưu trực tiếp trong localStorage và đăng nhập admin là demo phía client, không an toàn cho môi trường production.
- Sản phẩm mẫu được khởi tạo khi chưa có novaProducts. Dữ liệu cũ được giữ lại; nên sao lưu dữ liệu trước khi thử nghiệm nhiều thay đổi.
