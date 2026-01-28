# ✅ Đã fix lỗi Firebase Undefined Fields

## Vấn đề

**Lỗi:** `Function addDoc() called with invalid data. Unsupported field value: undefined (found in field notes)`

**Nguyên nhân:** 
- Firestore **KHÔNG** chấp nhận giá trị `undefined` trong documents
- Khi form field không bắt buộc và user không nhập, giá trị sẽ là `undefined`
- Cần phải loại bỏ các fields có giá trị `undefined` trước khi gửi lên Firestore

## Giải pháp

### 1. Tạo Utility Function

Tạo file `src/utils/firestore.ts` với 2 functions:

```typescript
// Loại bỏ undefined fields (shallow)
removeUndefinedFields<T>(obj: T): Partial<T>

// Loại bỏ undefined fields (deep - cho nested objects)
deepRemoveUndefinedFields<T>(obj: T): Partial<T>
```

### 2. Áp dụng cho tất cả Services

Đã update các services sau:

#### ✅ reservationService.ts
- `createReservation()` - Wrap data với `removeUndefinedFields()`
- `updateReservation()` - Wrap data với `removeUndefinedFields()`

#### ✅ customerService.ts
- `createCustomer()` - Wrap data với `removeUndefinedFields()`
- `updateCustomer()` - Wrap data với `removeUndefinedFields()`

#### ✅ roomService.ts
- `createRoom()` - Wrap data với `removeUndefinedFields()`
- `updateRoom()` - Wrap data với `removeUndefinedFields()`

### 3. Pattern sử dụng

**Trước (Lỗi):**
```typescript
const data = {
  name: 'John',
  notes: undefined,  // ❌ Firestore không chấp nhận
  createdAt: Timestamp.now(),
};

await addDoc(collection(db, 'collection'), data);
```

**Sau (Đúng):**
```typescript
const data = removeUndefinedFields({
  name: 'John',
  notes: undefined,  // ✅ Sẽ bị loại bỏ
  createdAt: Timestamp.now(),
});

await addDoc(collection(db, 'collection'), data);
// Result: { name: 'John', createdAt: Timestamp }
```

## Các trường hợp sử dụng

### Optional Form Fields
```typescript
// Form có field không bắt buộc
const formData = {
  name: 'John',
  email: 'john@example.com',
  phone: '123456',
  notes: undefined,        // User không nhập
  preferences: undefined,  // User không nhập
};

// Trước khi gửi lên Firestore
const cleanData = removeUndefinedFields(formData);
// Result: { name: 'John', email: '...', phone: '...' }
```

### Partial Updates
```typescript
// Update một số fields
const updates = {
  name: 'New Name',
  email: undefined,  // Không update email
  phone: '999999',
};

await updateDoc(docRef, removeUndefinedFields(updates));
// Chỉ update name và phone, không touch email
```

### Nested Objects
```typescript
// Nếu có nested objects với undefined
const data = {
  user: {
    name: 'John',
    address: undefined,
  },
  settings: {
    theme: 'dark',
    notifications: undefined,
  },
};

// Sử dụng deep remove
const cleanData = deepRemoveUndefinedFields(data);
```

## Best Practices

### 1. Luôn wrap data trước khi gửi lên Firestore

```typescript
// ✅ ĐÚNG
await addDoc(collection(db, 'items'), removeUndefinedFields(data));

// ❌ SAI
await addDoc(collection(db, 'items'), data);
```

### 2. Sử dụng trong tất cả CRUD operations

```typescript
// Create
await addDoc(collection(db, 'items'), removeUndefinedFields(data));

// Update
await updateDoc(docRef, removeUndefinedFields(updates));

// Set with merge
await setDoc(docRef, removeUndefinedFields(data), { merge: true });
```

### 3. Xử lý optional fields trong TypeScript

```typescript
interface Customer {
  name: string;
  email: string;
  phone: string;
  address?: string;      // Optional
  preferences?: string;  // Optional
  notes?: string;        // Optional
}

// Khi tạo customer
const customer: Customer = {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  address: formData.address,      // Có thể undefined
  preferences: formData.preferences, // Có thể undefined
  notes: formData.notes,          // Có thể undefined
};

// Clean trước khi save
await addDoc(
  collection(db, 'customers'),
  removeUndefinedFields(customer)
);
```

## Lưu ý quan trọng

### 1. Null vs Undefined

```typescript
// undefined - Sẽ bị loại bỏ
{ name: 'John', notes: undefined }
// Result: { name: 'John' }

// null - Sẽ được giữ lại
{ name: 'John', notes: null }
// Result: { name: 'John', notes: null }
```

### 2. Empty string vs Undefined

```typescript
// Empty string - Sẽ được giữ lại
{ name: 'John', notes: '' }
// Result: { name: 'John', notes: '' }

// undefined - Sẽ bị loại bỏ
{ name: 'John', notes: undefined }
// Result: { name: 'John' }
```

### 3. Khi nào dùng deep vs shallow

```typescript
// Shallow - Cho objects phẳng (thường dùng)
const data = { name: 'John', notes: undefined };
removeUndefinedFields(data);

// Deep - Cho nested objects
const data = {
  user: { name: 'John', address: undefined },
  settings: { theme: 'dark', lang: undefined }
};
deepRemoveUndefinedFields(data);
```

## Test

Bây giờ bạn có thể:

1. ✅ Tạo reservation mà không nhập notes
2. ✅ Tạo customer mà không nhập address, preferences, notes
3. ✅ Update reservation mà không thay đổi tất cả fields
4. ✅ Không còn lỗi "Unsupported field value: undefined"

## Các files đã được cập nhật

- ✅ `src/utils/firestore.ts` - Utility functions mới
- ✅ `src/services/reservationService.ts` - Áp dụng removeUndefinedFields
- ✅ `src/services/customerService.ts` - Áp dụng removeUndefinedFields
- ✅ `src/services/roomService.ts` - Áp dụng removeUndefinedFields

## Áp dụng cho services khác

Khi tạo services mới, nhớ:

```typescript
import { removeUndefinedFields } from '../utils/firestore';

// Trong create method
const data = removeUndefinedFields({
  ...inputData,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

await addDoc(collection(db, 'collection'), data);

// Trong update method
await updateDoc(docRef, removeUndefinedFields({
  ...updates,
  updatedAt: Timestamp.now(),
}));
```
