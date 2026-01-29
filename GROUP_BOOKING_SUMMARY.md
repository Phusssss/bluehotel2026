# Group Booking Feature - Implementation Summary

## Overview

Tính năng đặt phòng theo nhóm (Group Booking) đã được thiết kế và thêm vào spec của hệ thống quản lý khách sạn. Tính năng này cho phép nhân viên lễ tân tạo đơn đặt phòng cho nhiều phòng cùng lúc, với khả năng gợi ý phòng thay thế khi không đủ phòng trống.

## Phương Án Đã Chọn: Linked Reservations (Phương án 1)

### Ưu điểm:
- Giữ nguyên logic hiện tại "1 reservation = 1 room"
- Thay đổi tối thiểu đối với code hiện có
- Dễ dàng mở rộng và bảo trì
- Linh hoạt: có thể check-in/check-out từng phòng riêng lẻ hoặc cả nhóm

### Cách Hoạt Động:
- Mỗi phòng vẫn có 1 reservation document riêng
- Các reservation trong cùng 1 nhóm được liên kết bằng `groupId` chung
- Metadata bổ sung: `groupSize`, `groupIndex`, `isGroupBooking`

## Thay Đổi Data Model

### Reservation Interface - Thêm 4 trường mới:

```typescript
interface Reservation {
  // ... existing fields ...
  
  // Group booking fields
  groupId?: string;              // UUID linking reservations in the same group
  groupSize?: number;            // Total number of rooms in the group
  groupIndex?: number;           // Position in group (1, 2, 3, ...)
  isGroupBooking: boolean;       // Flag indicating if this is part of a group
}
```

## Tính Năng Chính

### 1. Kiểm Tra Khả Dụng Cho Nhiều Loại Phòng
- Nhân viên chọn nhiều loại phòng với số lượng
- Hệ thống kiểm tra khả dụng cho tất cả loại phòng
- Hiển thị kết quả: đủ phòng / không đủ phòng

### 2. Gợi Ý Phòng Thay Thế (Alternatives)
**Khi không đủ phòng:**
- Hệ thống tự động tìm loại phòng thay thế (upgrade)
- Điều kiện: capacity >= loại phòng yêu cầu
- Hiển thị % chênh lệch giá
- Sắp xếp theo giá (rẻ nhất trước)

**Ví dụ:**
- Khách muốn: 2 phòng đơn (100k/đêm)
- Chỉ còn: 1 phòng đơn
- Gợi ý: 1 phòng đôi (150k/đêm, +50%)

### 3. Tạo Group Booking
- Sử dụng Firestore Batch Write (đảm bảo atomicity)
- Tạo N reservations với cùng groupId
- Tất cả thành công hoặc tất cả thất bại (all-or-nothing)

### 4. Hiển Thị Group Booking
- Badge "GROUP" để phân biệt
- Hiển thị tổng số phòng và tổng giá
- Expand/collapse để xem chi tiết từng phòng
- Nút hành động: Check In All, Check Out All, Cancel All

### 5. Check-in/Check-out Nhóm
- Check-in tất cả phòng cùng lúc
- Check-out tất cả phòng cùng lúc
- Hiển thị folio tổng hợp cho cả nhóm
- Vẫn có thể thao tác từng phòng riêng lẻ

## Flow Đặt Phòng Nhóm

### Bước 1: Chọn Thông Tin Cơ Bản
- Chọn khách hàng
- Chọn ngày nhận/trả phòng
- Chọn nguồn đặt phòng
- Chọn nhiều loại phòng với số lượng

### Bước 2: Kiểm Tra Khả Dụng
- Hệ thống kiểm tra từng loại phòng
- Hiển thị kết quả:
  - ✅ Đủ phòng: hiển thị danh sách phòng trống
  - ⚠️ Không đủ: hiển thị phòng có + gợi ý thay thế

### Bước 3: Chọn Phòng Cụ Thể
- Nhân viên chọn phòng cụ thể cho mỗi loại
- Có thể chấp nhận gợi ý thay thế
- Nhập số khách cho mỗi phòng

### Bước 4: Xác Nhận
- Hiển thị tổng quan tất cả phòng đã chọn
- Tính giá cho từng phòng (áp dụng pricing calculator)
- Hiển thị tổng giá cho cả nhóm
- Xác nhận tạo đơn

## Service Methods Mới

### reservationService.ts

```typescript
// Check availability for multiple room types
checkGroupAvailability(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string,
  roomTypeRequests: Array<{ roomTypeId: string; quantity: number }>
): Promise<RoomAvailability[]>

// Find alternative room types (upgrades)
findAlternativeRoomTypes(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string,
  requestedRoomTypeId: string,
  neededQuantity: number
): Promise<Alternative[]>

// Create group booking with batch write
createGroupBooking(input: GroupBookingInput): Promise<string[]>

// Get all reservations in a group
getGroupReservations(groupId: string): Promise<Reservation[]>

// Group operations
checkInGroup(groupId: string): Promise<void>
checkOutGroup(groupId: string): Promise<void>
cancelGroupBooking(groupId: string): Promise<void>
calculateGroupTotal(reservations: Reservation[]): number
```

## UI Components Mới

### 1. CreateGroupBookingForm
- Multi-step wizard (4 bước)
- Tích hợp pricing calculator
- Hiển thị alternatives
- Loading states

### 2. GroupReservationCard
- Hiển thị thông tin nhóm
- Expand/collapse chi tiết
- Group action buttons

### 3. RoomTypeSelectionStep
- Chọn nhiều loại phòng với số lượng
- Validation

### 4. RoomSelectionStep
- Hiển thị availability results
- Hiển thị alternatives
- Chọn phòng cụ thể

### 5. ConfirmationStep
- Review tất cả phòng
- Hiển thị price breakdown
- Confirm button

## Firestore Index Mới

```json
{
  "collectionGroup": "reservations",
  "fields": [
    { "fieldPath": "hotelId", "order": "ASCENDING" },
    { "fieldPath": "groupId", "order": "ASCENDING" },
    { "fieldPath": "groupIndex", "order": "ASCENDING" }
  ]
}
```

## Correctness Properties (8 properties mới)

### Property 38: Group Booking Atomicity
Tạo N reservations thành công hoặc không tạo gì cả

### Property 39: Group Booking Metadata Consistency
Tất cả reservations trong nhóm có cùng groupId, groupSize, và unique groupIndex

### Property 40: Group Availability Check Completeness
Kiểm tra khả dụng cho tất cả loại phòng được yêu cầu

### Property 41: Alternative Room Type Suggestions
Gợi ý phòng thay thế khi không đủ phòng, sắp xếp theo giá

### Property 42: Group Check-In State Transition
Check-in tất cả phòng trong nhóm, cập nhật status và room status

### Property 43: Group Check-Out State Transition
Check-out tất cả phòng, tạo housekeeping tasks

### Property 44: Group Cancellation Consistency
Cancel tất cả reservations trong nhóm

### Property 45: Group Total Price Calculation
Tổng giá = tổng của tất cả reservations trong nhóm

## Implementation Tasks (16 tasks)

### Task 12.7.1-12.7.9: Backend Implementation
- Update data model
- Implement service methods
- Add Firestore index

### Task 12.7.10-12.7.14: Frontend Implementation
- Create UI components
- Update existing pages
- Add translations

### Task 12.7.15-12.7.16: Testing
- Write property tests (8 properties)
- Write unit tests (edge cases)

## Translations Cần Thêm

### English (en/reservations.json)
```json
{
  "groupBooking": {
    "title": "Create Group Booking",
    "selectTypes": "Select Room Types",
    "selectRooms": "Select Rooms",
    "confirm": "Confirm Booking",
    "totalRooms": "Total Rooms",
    "totalPrice": "Total Price",
    "alternatives": "Alternative Suggestions",
    "checkInAll": "Check In All",
    "checkOutAll": "Check Out All",
    "cancelAll": "Cancel All",
    "createSuccess": "Group booking created successfully"
  }
}
```

### Vietnamese (vi/reservations.json)
```json
{
  "groupBooking": {
    "title": "Tạo Đặt Phòng Nhóm",
    "selectTypes": "Chọn Loại Phòng",
    "selectRooms": "Chọn Phòng",
    "confirm": "Xác Nhận Đặt Phòng",
    "totalRooms": "Tổng Số Phòng",
    "totalPrice": "Tổng Giá",
    "alternatives": "Gợi Ý Thay Thế",
    "checkInAll": "Nhận Phòng Tất Cả",
    "checkOutAll": "Trả Phòng Tất Cả",
    "cancelAll": "Hủy Tất Cả",
    "createSuccess": "Tạo đặt phòng nhóm thành công"
  }
}
```

## Ví Dụ Sử Dụng

### Scenario: Khách đặt 3 phòng

**Input:**
- Khách hàng: Nguyễn Văn A
- Ngày: 2026-02-01 đến 2026-02-03 (2 đêm)
- Yêu cầu: 1 phòng đơn, 1 phòng đôi, 1 phòng gia đình

**Process:**
1. Nhân viên chọn 3 loại phòng
2. Hệ thống kiểm tra:
   - Phòng đơn: ✅ Có 2 phòng trống
   - Phòng đôi: ✅ Có 3 phòng trống
   - Phòng gia đình: ⚠️ Hết phòng
3. Hệ thống gợi ý:
   - Phòng VIP (4 người, +20% giá)
   - Suite (6 người, +50% giá)
4. Nhân viên chọn phòng VIP thay thế
5. Chọn phòng cụ thể: 101, 201, 301
6. Xác nhận:
   - Phòng 101 (Đơn): 200k
   - Phòng 201 (Đôi): 300k
   - Phòng 301 (VIP): 360k
   - **Tổng: 860k**
7. Tạo 3 reservations với cùng groupId

**Result:**
- 3 reservation documents được tạo
- Tất cả có cùng groupId
- groupSize = 3
- groupIndex = 1, 2, 3

## Lợi Ích

### Cho Khách Sạn:
- ✅ Không mất khách do hết phòng
- ✅ Tăng doanh thu từ upsell (gợi ý upgrade)
- ✅ Xử lý nhanh hơn (1 transaction thay vì 3)
- ✅ Giảm sai sót (atomicity)

### Cho Nhân Viên:
- ✅ Dễ dàng đặt nhiều phòng cùng lúc
- ✅ Tự động gợi ý khi hết phòng
- ✅ Check-in/out nhóm nhanh chóng
- ✅ Quản lý folio tập trung

### Cho Khách Hàng:
- ✅ Đặt được phòng ngay cả khi không đủ loại yêu cầu
- ✅ Nhận được gợi ý phòng tốt hơn
- ✅ Check-in/out nhanh cho cả nhóm

## Next Steps

Để bắt đầu implement, bạn có thể:

1. **Bắt đầu với backend:**
   ```
   Implement task 12.7.1 - Update Reservation data model
   ```

2. **Hoặc xem toàn bộ tasks:**
   ```
   Open .kiro/specs/hotel-management-system/tasks.md
   Navigate to task 12.7
   ```

3. **Hoặc implement từng phần:**
   - Task 12.7.1-12.7.5: Core service methods
   - Task 12.7.6-12.7.9: Group operations
   - Task 12.7.10-12.7.14: UI components
   - Task 12.7.15-12.7.16: Testing

## Files Updated

1. ✅ `.kiro/specs/hotel-management-system/requirements.md`
   - Added Requirement 6.1: Group Booking Support (13 acceptance criteria)

2. ✅ `.kiro/specs/hotel-management-system/design.md`
   - Added Group Booking Implementation section
   - Added 8 new correctness properties (38-45)
   - Added service layer design
   - Added UI component design
   - Added Firestore index specification

3. ✅ `.kiro/specs/hotel-management-system/tasks.md`
   - Added Task 12.7: Group Booking Feature (16 sub-tasks)
   - Updated notes to reflect 45 total properties

## Câu Hỏi?

Nếu bạn muốn:
- Bắt đầu implement → Cho tôi biết task nào muốn làm trước
- Thay đổi thiết kế → Cho tôi biết phần nào cần điều chỉnh
- Hiểu rõ hơn về flow → Tôi có thể giải thích chi tiết hơn

Bạn có muốn bắt đầu implement không? Hoặc có câu hỏi gì về thiết kế này?
