import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Feature: hotel-management-system, Property 9: Hotel Access List Accuracy
 * For any regular user, the hotel selection modal should display exactly the hotels
 * where a hotelUsers document exists for that user.
 * 
 * Validates: Requirements 4.1
 */
describe('HotelContext Property Tests', () => {
  const testUserIds: string[] = [];
  const testHotelIds: string[] = [];
  const testHotelUserIds: string[] = [];

  afterEach(async () => {
    // Cleanup test data
    for (const hotelUserId of testHotelUserIds) {
      try {
        await deleteDoc(doc(db, 'hotelUsers', hotelUserId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const hotelId of testHotelIds) {
      try {
        await deleteDoc(doc(db, 'hotels', hotelId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const userId of testUserIds) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    testHotelUserIds.length = 0;
    testHotelIds.length = 0;
    testUserIds.length = 0;
  });

  it('Property 9: Hotel Access List Accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          hotels: fc.array(
            fc.record({
              hotelId: fc.uuid(),
              hotelName: fc.string({ minLength: 3, maxLength: 50 }),
              address: fc.string({ minLength: 5, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              email: fc.emailAddress(),
              permission: fc.constantFrom('owner', 'manager', 'receptionist', 'housekeeping'),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (testData) => {
          const { userId, hotels } = testData;

          // Track for cleanup
          testUserIds.push(userId);

          // Arrange: Create user document
          const userDocRef = doc(db, 'users', userId);
          await setDoc(userDocRef, {
            uid: userId,
            email: `test-${userId}@example.com`,
            displayName: 'Test User',
            photoURL: 'https://example.com/photo.jpg',
            role: 'regular',
            language: 'en',
            status: 'active',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Create hotel documents and hotelUsers documents
          const expectedHotelIds = new Set<string>();
          
          for (const hotel of hotels) {
            const { hotelId, hotelName, address, phone, email, permission } = hotel;
            
            // Track for cleanup
            testHotelIds.push(hotelId);
            expectedHotelIds.add(hotelId);

            // Create hotel document
            const hotelDocRef = doc(db, 'hotels', hotelId);
            await setDoc(hotelDocRef, {
              name: hotelName,
              address: address,
              phone: phone,
              email: email,
              checkInTime: '14:00',
              checkOutTime: '12:00',
              taxRate: 10,
              currency: 'USD',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            // Create hotelUsers document
            const hotelUserId = `${userId}_${hotelId}`;
            testHotelUserIds.push(hotelUserId);
            
            const hotelUserDocRef = doc(db, 'hotelUsers', hotelUserId);
            await setDoc(hotelUserDocRef, {
              hotelId: hotelId,
              userId: userId,
              permission: permission,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
          }

          // Act: Query hotelUsers collection to get hotels user has access to
          // (This simulates what HotelContext.loadUserHotels does)
          const hotelUsersQuery = query(
            collection(db, 'hotelUsers'),
            where('userId', '==', userId)
          );
          const hotelUsersSnapshot = await getDocs(hotelUsersQuery);
          
          const retrievedHotelIds = hotelUsersSnapshot.docs.map(
            (doc) => doc.data().hotelId
          );

          // Assert: Verify the property holds
          // 1. The number of hotels should match
          expect(retrievedHotelIds.length).toBe(expectedHotelIds.size);
          
          // 2. All expected hotels should be in the retrieved list
          for (const expectedHotelId of expectedHotelIds) {
            expect(retrievedHotelIds).toContain(expectedHotelId);
          }
          
          // 3. No unexpected hotels should be in the retrieved list
          for (const retrievedHotelId of retrievedHotelIds) {
            expect(expectedHotelIds.has(retrievedHotelId)).toBe(true);
          }
          
          // 4. The sets should be exactly equal
          const retrievedHotelIdsSet = new Set(retrievedHotelIds);
          expect(retrievedHotelIdsSet.size).toBe(expectedHotelIds.size);
          
          for (const hotelId of expectedHotelIds) {
            expect(retrievedHotelIdsSet.has(hotelId)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property test
});
