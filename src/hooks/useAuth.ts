import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const response = await fetch('/auth/user', {
        method: 'GET',
        credentials: 'include',
      });
      
      console.log('📊 Auth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('👤 Auth data received:', data);
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: !!data.user,
        });
        console.log('✅ Authentication state updated:', !!data.user);
      } else {
        console.log('❌ Auth response not ok:', response.status, response.statusText);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const login = useCallback(() => {
    window.location.href = '/auth/google';
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  useEffect(() => {
    // Check for auth success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      console.log('🎉 Auth success detected, checking status...');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Trigger localStorage event to sync across tabs
      localStorage.setItem('auth_updated', Date.now().toString());
      localStorage.removeItem('auth_updated');
    }
    
    checkAuth();
    
    // Listen for storage events (for cross-tab auth updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_updated') {
        console.log('🔄 Auth updated in another tab, refreshing...');
        checkAuth();
      }
    };

    // Listen for focus events (when user returns to tab after auth)
    const handleFocus = () => {
      console.log('🔄 Window focused, checking auth status...');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth]);

  return {
    ...authState,
    login,
    logout,
    refetch: checkAuth,
  };
};