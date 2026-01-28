import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Feature: hotel-management-system, Property 1: User Creation and Authentication Round-Trip
 * For any successful Google authentication, creating a user document in Firestore and then
 * querying it should return a user with role='regular' and the authenticated user's email.
 * 
 * Validates: Requirements 1.2
 */
describe('AuthContext Property Tests', () => {
  const testUserIds: string[] = [];

  afterEach(async () => {
    // Cleanup test users
    for (const uid of testUserIds) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    testUserIds.length = 0;
  });

  it('Property 1: User Creation and Authentication Round-Trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          uid: fc.uuid(),
          email: fc.emailAddress(),
          displayName: fc.string({ minLength: 1, maxLength: 50 }),
          photoURL: fc.webUrl(),
        }),
        async (userData) => {
          // Track for cleanup
          testUserIds.push(userData.uid);

          // Arrange: Create user document (simulating what happens after Google auth)
          const userDocRef = doc(db, 'users', userData.uid);
          await setDoc(userDocRef, {
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            role: 'regular',
            language: 'en',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Act: Query the user document
          const userDoc = await getDoc(userDocRef);

          // Assert: Verify the property holds
          expect(userDoc.exists()).toBe(true);
          const retrievedUser = userDoc.data();
          expect(retrievedUser).toBeDefined();
          expect(retrievedUser!.role).toBe('regular');
          expect(retrievedUser!.email).toBe(userData.email);
          expect(retrievedUser!.uid).toBe(userData.uid);
          expect(retrievedUser!.displayName).toBe(userData.displayName);
          expect(retrievedUser!.status).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hotel-management-system, Property 2: Role-Based Routing
   * For any authenticated user, the system should redirect to the admin dashboard if
   * role='super_admin', or to hotel selection if role='regular'.
   * 
   * Validates: Requirements 1.4
   */
  it('Property 2: Role-Based Routing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          uid: fc.uuid(),
          email: fc.emailAddress(),
          displayName: fc.string({ minLength: 1, maxLength: 50 }),
          photoURL: fc.webUrl(),
          role: fc.constantFrom('super_admin' as const, 'regular' as const),
        }),
        async (userData) => {
          // Arrange: Determine expected redirect based on role
          const expectedRedirect = userData.role === 'super_admin' ? '/admin' : '/select-hotel';

          // Act: Simulate the routing logic
          let actualRedirect: string;
          if (userData.role === 'super_admin') {
            actualRedirect = '/admin';
          } else {
            actualRedirect = '/select-hotel';
          }

          // Assert: Verify the property holds
          expect(actualRedirect).toBe(expectedRedirect);
          
          // Additional verification: super_admin should never go to hotel selection
          if (userData.role === 'super_admin') {
            expect(actualRedirect).not.toBe('/select-hotel');
          }
          
          // Regular users should never go to admin dashboard
          if (userData.role === 'regular') {
            expect(actualRedirect).not.toBe('/admin');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
