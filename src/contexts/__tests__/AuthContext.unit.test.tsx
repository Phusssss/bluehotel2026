import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    // Immediately call with null user for tests
    callback(null);
    return vi.fn(); // Return unsubscribe function
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

vi.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Test component to access auth context
function TestComponent() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={signInWithGoogle}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe('AuthContext Unit Tests - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test Firebase Auth failure scenarios
   * Validates: Requirements 1.5
   */
  it('should handle Firebase Auth sign-in failure', async () => {
    const authError = new Error('Firebase Auth failed');
    (authError as any).code = 'auth/popup-closed-by-user';
    
    vi.mocked(signInWithPopup).mockRejectedValueOnce(authError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    });

    const signInButton = screen.getByText('Sign In');
    
    // Attempt sign in
    await expect(async () => {
      signInButton.click();
      await waitFor(() => {
        if (vi.mocked(signInWithPopup).mock.calls.length === 0) {
          throw new Error('Sign in not called');
        }
      });
    }).rejects.toThrow();

    // Verify user is still null after failed sign-in
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('should handle network errors during sign-in', async () => {
    const networkError = new Error('Network request failed');
    (networkError as any).code = 'auth/network-request-failed';
    
    vi.mocked(signInWithPopup).mockRejectedValueOnce(networkError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    });

    const signInButton = screen.getByText('Sign In');
    
    // Attempt sign in
    await expect(async () => {
      signInButton.click();
      await waitFor(() => {
        if (vi.mocked(signInWithPopup).mock.calls.length === 0) {
          throw new Error('Sign in not called');
        }
      });
    }).rejects.toThrow();

    // Verify user is still null
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  /**
   * Test locked user account handling
   * Validates: Requirements 1.5
   */
  it('should handle locked user account', async () => {
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'locked@example.com',
      displayName: 'Locked User',
      photoURL: 'http://example.com/photo.jpg',
    };

    const mockUserDoc = {
      exists: () => true,
      data: () => ({
        uid: 'test-uid',
        email: 'locked@example.com',
        displayName: 'Locked User',
        photoURL: 'http://example.com/photo.jpg',
        role: 'regular',
        language: 'en',
        status: 'locked', // User is locked
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    vi.mocked(signInWithPopup).mockResolvedValueOnce({
      user: mockFirebaseUser,
    } as any);

    vi.mocked(getDoc).mockResolvedValueOnce(mockUserDoc as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    });

    const signInButton = screen.getByText('Sign In');
    signInButton.click();

    // Wait for sign-in to complete
    await waitFor(() => {
      expect(vi.mocked(signInWithPopup)).toHaveBeenCalled();
    });

    // The user should be loaded even if locked (status check happens at route level)
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('locked@example.com');
    });
  });

  it('should handle Firestore read errors during user load', async () => {
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'http://example.com/photo.jpg',
    };

    const firestoreError = new Error('Firestore unavailable');
    (firestoreError as any).code = 'unavailable';

    vi.mocked(signInWithPopup).mockResolvedValueOnce({
      user: mockFirebaseUser,
    } as any);

    vi.mocked(getDoc).mockRejectedValueOnce(firestoreError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    });

    const signInButton = screen.getByText('Sign In');
    
    // Attempt sign in - should fail due to Firestore error
    await expect(async () => {
      signInButton.click();
      await waitFor(() => {
        if (vi.mocked(getDoc).mock.calls.length === 0) {
          throw new Error('getDoc not called');
        }
      });
    }).rejects.toThrow();
  });

  it('should handle sign-out errors gracefully', async () => {
    const signOutError = new Error('Sign out failed');
    vi.mocked(firebaseSignOut).mockRejectedValueOnce(signOutError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    });

    const signOutButton = screen.getByText('Sign Out');
    
    // Attempt sign out
    await expect(async () => {
      signOutButton.click();
      await waitFor(() => {
        if (vi.mocked(firebaseSignOut).mock.calls.length === 0) {
          throw new Error('Sign out not called');
        }
      });
    }).rejects.toThrow();
  });

  it('should handle popup blocked by browser', async () => {
    const popupError = new Error('Popup blocked');
    (popupError as any).code = 'auth/popup-blocked';
    
    vi.mocked(signInWithPopup).mockRejectedValueOnce(popupError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('not-loading');
    });

    const signInButton = screen.getByText('Sign In');
    
    await expect(async () => {
      signInButton.click();
      await waitFor(() => {
        if (vi.mocked(signInWithPopup).mock.calls.length === 0) {
          throw new Error('Sign in not called');
        }
      });
    }).rejects.toThrow();

    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });
});
