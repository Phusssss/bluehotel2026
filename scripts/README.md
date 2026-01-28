# Hướng dẫn thêm dữ liệu mẫu cho Hotel Management System

## Dữ liệu cần thiết để test chức năng đặt phòng

Để test chức năng đặt phòng, bạn cần có:

1. **Room Types** (Loại phòng) - 3 loại
2. **Rooms** (Phòng cụ thể) - 20 phòng
3. **Customers** (Khách hàng) - 8 khách hàng

## Cách 1: Thêm dữ liệu thủ công qua Firebase Console

### Bước 1: Thêm Room Types

Vào Firebase Console > Firestore Database > Bắt đầu collection `roomTypes`

**Room Type 1: Standard Room**
```json
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "name": "Standard Room",
  "description": {
    "en": "Comfortable standard room with basic amenities",
    "vi": "Phòng tiêu chuẩn thoải mái với tiện nghi cơ bản"
  },
  "basePrice": 500000,
  "capacity": 2,
  "amenities": ["WiFi", "TV", "Air Conditioning", "Mini Bar"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Room Type 2: Deluxe Room**
```json
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "name": "Deluxe Room",
  "description": {
    "en": "Spacious deluxe room with premium amenities",
    "vi": "Phòng deluxe rộng rãi với tiện nghi cao cấp"
  },
  "basePrice": 800000,
  "capacity": 3,
  "amenities": ["WiFi", "Smart TV", "Air Conditioning", "Mini Bar", "Bathtub", "City View"],
  "weekdayPricing": {
    "friday": 900000,
    "saturday": 950000,
    "sunday": 850000
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Room Type 3: Suite Room**
```json
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "name": "Suite Room",
  "description": {
    "en": "Luxurious suite with separate living area",
    "vi": "Suite sang trọng với khu vực sinh hoạt riêng"
  },
  "basePrice": 1500000,
  "capacity": 4,
  "amenities": ["WiFi", "Smart TV", "Air Conditioning", "Mini Bar", "Jacuzzi", "Ocean View", "Living Room"],
  "weekdayPricing": {
    "friday": 1800000,
    "saturday": 2000000,
    "sunday": 1600000
  },
  "seasonalPricing": [
    {
      "startDate": "2026-06-01",
      "endDate": "2026-08-31",
      "price": 2200000
    },
    {
      "startDate": "2026-12-20",
      "endDate": "2027-01-05",
      "price": 2500000
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Bước 2: Thêm Rooms

Sau khi tạo Room Types, lấy Document ID của từng loại phòng, sau đó tạo collection `rooms`:

**Lưu ý:** Thay `STANDARD_ROOM_TYPE_ID`, `DELUXE_ROOM_TYPE_ID`, `SUITE_ROOM_TYPE_ID` bằng ID thực tế từ bước 1.

**Standard Rooms (8 phòng):**
```json
// Room 101
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "roomNumber": "101",
  "roomTypeId": "STANDARD_ROOM_TYPE_ID",
  "floor": 1,
  "status": "vacant",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// Tương tự cho: 102, 103, 104, 105, 201, 202, 203
```

**Deluxe Rooms (7 phòng):**
```json
// Room 204
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "roomNumber": "204",
  "roomTypeId": "DELUXE_ROOM_TYPE_ID",
  "floor": 2,
  "status": "vacant",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// Tương tự cho: 205, 206, 301, 302, 303, 304
```

**Suite Rooms (5 phòng):**
```json
// Room 305
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "roomNumber": "305",
  "roomTypeId": "SUITE_ROOM_TYPE_ID",
  "floor": 3,
  "status": "vacant",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// Tương tự cho: 306, 401, 402, 403
```

### Bước 3: Thêm Customers

Tạo collection `customers`:

```json
// Customer 1
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "name": "Nguyễn Văn An",
  "email": "nguyenvanan@example.com",
  "phone": "0901234567",
  "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
  "nationality": "Vietnam",
  "idNumber": "001234567890",
  "preferences": "Phòng tầng cao, view đẹp",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// Customer 2
{
  "hotelId": "hqjikjkTipom9MMBFlxB",
  "name": "Trần Thị Bình",
  "email": "tranthibinh@example.com",
  "phone": "0912345678",
  "address": "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
  "nationality": "Vietnam",
  "idNumber": "001234567891",
  "preferences": "Không hút thuốc",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// ... Thêm 6 customers khác từ file sample-data.json
```

## Cách 2: Sử dụng Firestore Import (Nhanh hơn)

1. Mở Firebase Console
2. Vào Firestore Database
3. Click vào menu (3 chấm) > Import data
4. Upload file JSON với format phù hợp

## Cách 3: Tạm thời mở Firestore Rules để chạy script

**Lưu ý:** Chỉ làm trong môi trường development!

1. Mở file `firestore.rules`
2. Tạm thời thay đổi rules cho roomTypes, rooms, customers:

```javascript
match /roomTypes/{roomTypeId} {
  allow read, write: if true; // TEMPORARY - chỉ dùng cho testing
}

match /rooms/{roomId} {
  allow read, write: if true; // TEMPORARY - chỉ dùng cho testing
}

match /customers/{customerId} {
  allow read, write: if true; // TEMPORARY - chỉ dùng cho testing
}
```

3. Deploy rules: `firebase deploy --only firestore:rules`
4. Chạy script: `npm run seed:reservation`
5. **QUAN TRỌNG:** Đổi lại rules về như cũ sau khi xong!

## Dữ liệu mẫu đã tạo

### Room Types (3 loại)
- **Standard Room**: 500,000 VND/đêm, 2 người
- **Deluxe Room**: 800,000 VND/đêm (cuối tuần 900k-950k), 3 người
- **Suite Room**: 1,500,000 VND/đêm (cuối tuần 1.8M-2M, mùa cao điểm 2.2M-2.5M), 4 người

### Rooms (20 phòng)
- Tầng 1: 101-105 (Standard)
- Tầng 2: 201-203 (Standard), 204-206 (Deluxe)
- Tầng 3: 301-304 (Deluxe), 305-306 (Suite)
- Tầng 4: 401-403 (Suite)

### Customers (8 khách hàng)
- 6 khách Việt Nam
- 2 khách quốc tế (USA, Spain)

## Test chức năng đặt phòng

Sau khi thêm dữ liệu, bạn có thể:

1. Vào trang Reservations
2. Click "Create Reservation"
3. Chọn khách hàng từ dropdown
4. Chọn loại phòng
5. Chọn ngày check-in và check-out
6. Hệ thống sẽ tự động:
   - Hiển thị các phòng trống
   - Tính toán giá dựa trên ngày (weekday/seasonal pricing)
   - Hiển thị breakdown: số đêm, subtotal, tax, total
7. Chọn phòng và hoàn tất đặt phòng

## Lưu ý

- Tất cả giá tiền đều tính bằng VND
- Timestamp sẽ tự động được tạo khi thêm qua script
- Nếu thêm thủ công, chọn type "timestamp" và click "Set to current time"
- Hotel ID: `hqjikjkTipom9MMBFlxB` phải khớp với hotel bạn đang test
