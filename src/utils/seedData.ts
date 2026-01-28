import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const HOTEL_ID = 'hqjikjkTipom9MMBFlxB';

/**
 * Seed sample data for testing reservation functionality
 * This function should be called when user is authenticated
 */
export async function seedReservationData() {
  console.log('🌱 Bắt đầu tạo dữ liệu mẫu cho hotel:', HOTEL_ID);
  
  const results = {
    roomTypes: [] as string[],
    rooms: [] as string[],
    customers: [] as string[],
  };

  try {
    // 1. Create Room Types
    console.log('📋 Đang tạo Room Types...');
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

    for (const roomType of roomTypes) {
      const docRef = await addDoc(collection(db, 'roomTypes'), roomType);
      results.roomTypes.push(docRef.id);
      console.log(`✅ Đã tạo room type: ${roomType.name} (ID: ${docRef.id})`);
    }

    // 2. Create Rooms
    console.log('🏨 Đang tạo Rooms...');
    const rooms = [
      // Standard Rooms - Floor 1
      { roomNumber: '101', roomTypeId: results.roomTypes[0], floor: 1 },
      { roomNumber: '102', roomTypeId: results.roomTypes[0], floor: 1 },
      { roomNumber: '103', roomTypeId: results.roomTypes[0], floor: 1 },
      { roomNumber: '104', roomTypeId: results.roomTypes[0], floor: 1 },
      { roomNumber: '105', roomTypeId: results.roomTypes[0], floor: 1 },
      
      // Standard Rooms - Floor 2
      { roomNumber: '201', roomTypeId: results.roomTypes[0], floor: 2 },
      { roomNumber: '202', roomTypeId: results.roomTypes[0], floor: 2 },
      { roomNumber: '203', roomTypeId: results.roomTypes[0], floor: 2 },
      
      // Deluxe Rooms - Floor 2
      { roomNumber: '204', roomTypeId: results.roomTypes[1], floor: 2 },
      { roomNumber: '205', roomTypeId: results.roomTypes[1], floor: 2 },
      { roomNumber: '206', roomTypeId: results.roomTypes[1], floor: 2 },
      
      // Deluxe Rooms - Floor 3
      { roomNumber: '301', roomTypeId: results.roomTypes[1], floor: 3 },
      { roomNumber: '302', roomTypeId: results.roomTypes[1], floor: 3 },
      { roomNumber: '303', roomTypeId: results.roomTypes[1], floor: 3 },
      { roomNumber: '304', roomTypeId: results.roomTypes[1], floor: 3 },
      
      // Suite Rooms - Floor 3
      { roomNumber: '305', roomTypeId: results.roomTypes[2], floor: 3 },
      { roomNumber: '306', roomTypeId: results.roomTypes[2], floor: 3 },
      
      // Suite Rooms - Floor 4
      { roomNumber: '401', roomTypeId: results.roomTypes[2], floor: 4 },
      { roomNumber: '402', roomTypeId: results.roomTypes[2], floor: 4 },
      { roomNumber: '403', roomTypeId: results.roomTypes[2], floor: 4 },
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
      results.rooms.push(docRef.id);
      console.log(`✅ Đã tạo room: ${room.roomNumber} (ID: ${docRef.id})`);
    }

    // 3. Create Customers
    console.log('👥 Đang tạo Customers...');
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
      results.customers.push(docRef.id);
      console.log(`✅ Đã tạo customer: ${customer.name} (ID: ${docRef.id})`);
    }

    console.log('\n✨ Hoàn thành! Đã tạo xong dữ liệu mẫu.');
    console.log('\n📊 Tổng kết:');
    console.log(`   - ${results.roomTypes.length} loại phòng (Room Types)`);
    console.log(`   - ${results.rooms.length} phòng (Rooms)`);
    console.log(`   - ${results.customers.length} khách hàng (Customers)`);
    
    return results;
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error);
    throw error;
  }
}
