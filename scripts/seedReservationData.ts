import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config - sử dụng config từ .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const HOTEL_ID = 'hqjikjkTipom9MMBFlxB';

async function seedData() {
  console.log('🌱 Bắt đầu tạo dữ liệu mẫu cho hotel:', HOTEL_ID);
  
  try {
    // 1. Tạo Room Types (Loại phòng)
    console.log('\n📋 Đang tạo Room Types...');
    const roomTypes = [
      {
        hotelId: HOTEL_ID,
        name: 'Standard Room',
        description: {
          en: 'Comfortable standard room with basic amenities',
          vi: 'Phòng tiêu chuẩn thoải mái với tiện nghi cơ bản',
        },
        basePrice: 500000,
        capacity: 2,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Deluxe Room',
        description: {
          en: 'Spacious deluxe room with premium amenities',
          vi: 'Phòng deluxe rộng rãi với tiện nghi cao cấp',
        },
        basePrice: 800000,
        capacity: 3,
        amenities: ['WiFi', 'Smart TV', 'Air Conditioning', 'Mini Bar', 'Bathtub', 'City View'],
        weekdayPricing: {
          friday: 900000,
          saturday: 950000,
          sunday: 850000,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Suite Room',
        description: {
          en: 'Luxurious suite with separate living area',
          vi: 'Suite sang trọng với khu vực sinh hoạt riêng',
        },
        basePrice: 1500000,
        capacity: 4,
        amenities: ['WiFi', 'Smart TV', 'Air Conditioning', 'Mini Bar', 'Jacuzzi', 'Ocean View', 'Living Room'],
        weekdayPricing: {
          friday: 1800000,
          saturday: 2000000,
          sunday: 1600000,
        },
        seasonalPricing: [
          {
            startDate: '2026-06-01',
            endDate: '2026-08-31',
            price: 2200000,
          },
          {
            startDate: '2026-12-20',
            endDate: '2027-01-05',
            price: 2500000,
          },
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];

    const roomTypeIds: string[] = [];
    for (const roomType of roomTypes) {
      const docRef = await addDoc(collection(db, 'roomTypes'), roomType);
      roomTypeIds.push(docRef.id);
      console.log(`✅ Đã tạo room type: ${roomType.name} (ID: ${docRef.id})`);
    }

    // 2. Tạo Rooms (Phòng cụ thể)
    console.log('\n🏨 Đang tạo Rooms...');
    const rooms = [
      // Standard Rooms - Floor 1
      { roomNumber: '101', roomTypeId: roomTypeIds[0], floor: 1 },
      { roomNumber: '102', roomTypeId: roomTypeIds[0], floor: 1 },
      { roomNumber: '103', roomTypeId: roomTypeIds[0], floor: 1 },
      { roomNumber: '104', roomTypeId: roomTypeIds[0], floor: 1 },
      { roomNumber: '105', roomTypeId: roomTypeIds[0], floor: 1 },
      
      // Standard Rooms - Floor 2
      { roomNumber: '201', roomTypeId: roomTypeIds[0], floor: 2 },
      { roomNumber: '202', roomTypeId: roomTypeIds[0], floor: 2 },
      { roomNumber: '203', roomTypeId: roomTypeIds[0], floor: 2 },
      
      // Deluxe Rooms - Floor 2
      { roomNumber: '204', roomTypeId: roomTypeIds[1], floor: 2 },
      { roomNumber: '205', roomTypeId: roomTypeIds[1], floor: 2 },
      { roomNumber: '206', roomTypeId: roomTypeIds[1], floor: 2 },
      
      // Deluxe Rooms - Floor 3
      { roomNumber: '301', roomTypeId: roomTypeIds[1], floor: 3 },
      { roomNumber: '302', roomTypeId: roomTypeIds[1], floor: 3 },
      { roomNumber: '303', roomTypeId: roomTypeIds[1], floor: 3 },
      { roomNumber: '304', roomTypeId: roomTypeIds[1], floor: 3 },
      
      // Suite Rooms - Floor 3
      { roomNumber: '305', roomTypeId: roomTypeIds[2], floor: 3 },
      { roomNumber: '306', roomTypeId: roomTypeIds[2], floor: 3 },
      
      // Suite Rooms - Floor 4
      { roomNumber: '401', roomTypeId: roomTypeIds[2], floor: 4 },
      { roomNumber: '402', roomTypeId: roomTypeIds[2], floor: 4 },
      { roomNumber: '403', roomTypeId: roomTypeIds[2], floor: 4 },
    ];

    for (const room of rooms) {
      const roomData = {
        hotelId: HOTEL_ID,
        roomNumber: room.roomNumber,
        roomTypeId: room.roomTypeId,
        floor: room.floor,
        status: 'vacant',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      console.log(`✅ Đã tạo room: ${room.roomNumber} (ID: ${docRef.id})`);
    }

    // 3. Tạo Customers (Khách hàng)
    console.log('\n👥 Đang tạo Customers...');
    const customers = [
      {
        hotelId: HOTEL_ID,
        name: 'Nguyễn Văn An',
        email: 'nguyenvanan@example.com',
        phone: '0901234567',
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        nationality: 'Vietnam',
        idNumber: '001234567890',
        preferences: 'Phòng tầng cao, view đẹp',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Trần Thị Bình',
        email: 'tranthibinh@example.com',
        phone: '0912345678',
        address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        nationality: 'Vietnam',
        idNumber: '001234567891',
        preferences: 'Không hút thuốc',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Lê Minh Cường',
        email: 'leminhcuong@example.com',
        phone: '0923456789',
        address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
        nationality: 'Vietnam',
        idNumber: '001234567892',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Phạm Thu Dung',
        email: 'phamthudung@example.com',
        phone: '0934567890',
        address: '321 Đường Võ Văn Tần, Quận 3, TP.HCM',
        nationality: 'Vietnam',
        idNumber: '001234567893',
        preferences: 'Giường đôi',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'John Smith',
        email: 'johnsmith@example.com',
        phone: '+1234567890',
        address: '123 Main Street, New York, USA',
        nationality: 'USA',
        idNumber: 'P123456789',
        preferences: 'English speaking staff',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Maria Garcia',
        email: 'mariagarcia@example.com',
        phone: '+34123456789',
        address: '456 Calle Mayor, Madrid, Spain',
        nationality: 'Spain',
        idNumber: 'P987654321',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Hoàng Văn Em',
        email: 'hoangvanem@example.com',
        phone: '0945678901',
        address: '654 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
        nationality: 'Vietnam',
        idNumber: '001234567894',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        hotelId: HOTEL_ID,
        name: 'Đỗ Thị Phương',
        email: 'dothiphuong@example.com',
        phone: '0956789012',
        address: '987 Đường Hai Bà Trưng, Quận 3, TP.HCM',
        nationality: 'Vietnam',
        idNumber: '001234567895',
        preferences: 'Phòng yên tĩnh',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];

    for (const customer of customers) {
      const docRef = await addDoc(collection(db, 'customers'), customer);
      console.log(`✅ Đã tạo customer: ${customer.name} (ID: ${docRef.id})`);
    }

    console.log('\n✨ Hoàn thành! Đã tạo xong dữ liệu mẫu.');
    console.log('\n📊 Tổng kết:');
    console.log(`   - ${roomTypes.length} loại phòng (Room Types)`);
    console.log(`   - ${rooms.length} phòng (Rooms)`);
    console.log(`   - ${customers.length} khách hàng (Customers)`);
    console.log('\n🎉 Bây giờ bạn có thể test chức năng đặt phòng!');
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error);
    throw error;
  }
}

// Chạy script
seedData()
  .then(() => {
    console.log('\n✅ Script hoàn thành thành công!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script thất bại:', error);
    process.exit(1);
  });
