# 📚 E-Book App

Ứng dụng **E-Book** là một dự án mã nguồn mở xây dựng trên nền tảng React Native sử dụng Expo. Ứng dụng cung cấp trải nghiệm đọc sách điện tử hiện đại, đa nền tảng (Android, iOS, web), với các tính năng mở rộng như lưu trữ sách, đồng bộ dữ liệu, quản lý thư viện cá nhân, và hỗ trợ nhiều định dạng file.

---

## 🚀 Tính năng nổi bật

- Đọc sách điện tử (PDF, v.v.) với giao diện tối ưu cho thiết bị di động.
- Viết sách
- Speech to text
- Quản lý thư viện sách cá nhân, lưu trữ sách offline.
- Đồng bộ dữ liệu người dùng với Firebase & Supabase.
- Hỗ trợ đăng nhập, xác thực và lưu trạng thái đọc.
- Tìm kiếm, đánh dấu trang, và ghi chú trong sách.
- Giao diện đẹp, hiện đại.

---

## 🛠️ Công nghệ sử dụng

- **Expo & React Native**: Xây dựng ứng dụng mobile & web.
- **Firebase & Supabase**: Lưu trữ dữ liệu, xác thực, đồng bộ.
- **React Navigation**: Điều hướng giữa các màn hình.
- **NativeWind & TailwindCSS**: Tối ưu giao diện, dễ dàng tuỳ chỉnh.
- **react-native-pdf, react-native-blob-util**: Hiển thị và tải file PDF.
- **Jest**: Viết unit test.

---

## 📦 Cài đặt & chạy thử

1. **Cài đặt các package cần thiết**
    ```bash
    npm install
    ```

2. **Chạy ứng dụng**
    ```bash
    npx expo start
    ```
    Sau đó, bạn có thể chọn chạy trên:
    - Thiết bị thật (qua Expo Go)
    - Giả lập Android/iOS
    - Trình duyệt web

3. **Reset project (nếu cần)**
    ```bash
    npm run reset-project
    ```

---

## 🗂 Cấu trúc thư mục

- `/app`: Toàn bộ mã nguồn ứng dụng chính (giao diện, điều hướng, logic).
- `/assets`: Tài nguyên tĩnh (icon, ảnh splash, v.v.).
- `/scripts`: Script tiện ích cho phát triển (reset project, v.v.).
- `package.json`: Quản lý dependencies và script.
- `app.json`: Cấu hình Expo project.

---

## 📖 Hướng dẫn phát triển

- **Thêm package mới:**  
  Sử dụng `npm install <package-name>` và commit lại `package.json`, `package-lock.json`.
- **Chạy test:**  
  ```bash
  npm test
  ```
- **Cấu hình môi trường:**  
  Sử dụng các biến môi trường với Firebase/Supabase hoặc chỉnh sửa trong `app.json`.

---

## 🌐 Tham khảo & Tài liệu

- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/docs)
- [Supabase](https://supabase.com/docs)
- [react-native-pdf](https://github.com/wonday/react-native-pdf)

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón!  
Vui lòng tạo Pull Request hoặc Issue để thảo luận thêm.

---

## 📢 Liên hệ

Nếu bạn có câu hỏi hoặc cần hỗ trợ, hãy mở Issue mới trên GitHub repo này!

---

**Made with ❤️ by [Etorium0](https://github.com/Etorium0)**
