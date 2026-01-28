# Hướng Dẫn Deploy Firebase

## Bước 1: Cài đặt Firebase CLI

Nếu chưa cài đặt Firebase CLI, chạy lệnh:

```bash
npm install -g firebase-tools
```

## Bước 2: Đăng nhập Firebase

```bash
firebase login
```

Trình duyệt sẽ mở và yêu cầu bạn đăng nhập bằng tài khoản Google.

## Bước 3: Khởi tạo Firebase trong project

```bash
firebase init
```

Chọn các tùy chọn sau:
- **Firestore**: Setup Firestore security rules and indexes
- **Hosting**: Configure files for Firebase Hosting
- **Storage**: Configure security rules for Cloud Storage

Khi được hỏi:
- **Use an existing project**: Chọn `bluehotel-2024`
- **Firestore rules file**: Nhấn Enter (sử dụng `firestore.rules`)
- **Firestore indexes file**: Nhấn Enter (sử dụng `firestore.indexes.json`)
- **Public directory**: Nhập `dist`
- **Configure as single-page app**: Chọn `Yes`
- **Set up automatic builds**: Chọn `No`
- **Storage rules file**: Nhấn Enter (sử dụng `storage.rules`)

## Bước 4: Deploy Firestore Rules và Indexes

Deploy security rules cho Firestore:

```bash
firebase deploy --only firestore:rules
```

Deploy indexes cho Firestore:

```bash
firebase deploy --only firestore:indexes
```

## Bước 5: Deploy Storage Rules

Deploy security rules cho Storage:

```bash
firebase deploy --only storage
```

## Bước 6: Kiểm tra cấu hình

Sau khi deploy, kiểm tra trong Firebase Console:

1. **Firestore Database** → **Rules**: Xem rules đã được cập nhật
2. **Firestore Database** → **Indexes**: Xem indexes đang được tạo (có thể mất vài phút)
3. **Storage** → **Rules**: Xem storage rules đã được cập nhật

## Bước 7: Test ứng dụng

Chạy ứng dụng local để test:

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173` và thử:
1. Đăng nhập bằng Google
2. Kiểm tra xem user được tạo trong Firestore collection `users`

## Bước 8: Deploy ứng dụng lên Firebase Hosting (Tùy chọn)

Khi sẵn sàng deploy ứng dụng lên production:

```bash
npm run build
firebase deploy --only hosting
```

Ứng dụng sẽ được deploy tại: `https://bluehotel-2024.web.app`

## Lưu ý quan trọng

### Security Rules đã được cấu hình:

1. **Multi-tenancy**: Tất cả dữ liệu được phân tách theo `hotelId`
2. **Authentication**: Chỉ user đã đăng nhập mới có thể truy cập
3. **Permission-based**: Kiểm tra quyền truy cập dựa trên collection `hotelUsers`
4. **Super Admin**: User có role `super_admin` có thể xem tất cả dữ liệu

### Tạo Super Admin đầu tiên:

1. Đăng nhập vào ứng dụng lần đầu
2. Vào Firebase Console → Firestore Database
3. Tìm document của bạn trong collection `users`
4. Sửa field `role` từ `"regular"` thành `"super_admin"`
5. Refresh ứng dụng

## Troubleshooting

### Lỗi "Permission denied"
- Kiểm tra xem rules đã được deploy chưa
- Kiểm tra xem user đã đăng nhập chưa
- Kiểm tra xem user có quyền truy cập hotel không (collection `hotelUsers`)

### Lỗi "Index not found"
- Chờ vài phút để Firebase tạo indexes
- Hoặc deploy lại: `firebase deploy --only firestore:indexes`

### Lỗi khi build
- Xóa folder `dist` và build lại: `npm run build`
- Kiểm tra file `.env` có đầy đủ thông tin không

## Các lệnh hữu ích

```bash
# Xem project hiện tại
firebase projects:list

# Chuyển project
firebase use bluehotel-2024

# Deploy tất cả
firebase deploy

# Deploy chỉ rules
firebase deploy --only firestore:rules,storage

# Xem logs
firebase functions:log
```
