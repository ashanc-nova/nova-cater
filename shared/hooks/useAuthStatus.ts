import { useState, useEffect, useCallback } from 'react';
import { isLoggedIn } from '../../services/tokenServices';
import { clearLocalStoragePreservingMobileAddresses } from '../utils/localStorageSession';
import { clearUserProfileFetchCache, getUserProfile } from '../../services/authService';

export interface UserProfile {
  refId?: string;
  firstName?: string;
  lastName?: string;
}

export interface LogoutOptions {
  /** When false, skip redirect after logout (e.g. on gift card page where login is optional). Default true. */
  redirect?: boolean;
}

export interface AuthStatusReturn {
  isUserLoggedIn: boolean;
  userProfile: UserProfile | null;
  userInitials: string;
  isLoading: boolean;
  refreshAuthStatus: () => Promise<void>;
  handleLogout: (options?: LogoutOptions) => void;
}

import { AUTH_CHANGE_EVENT } from '../constants/auth';
const USER_PROFILE_STORAGE_KEY = 'userProfile';

const dispatchAuthChangeEvent = () => {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
};

// Helper to get cached profile from localStorage
const getCachedProfile = (): UserProfile | null => {
  try {
    const cached = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to parse cached user profile:', error);
  }
  return null;
};

// Helper to save profile to localStorage
const saveCachedProfile = (profile: UserProfile | null) => {
  try {
    if (profile) {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to cache user profile:', error);
  }
};

export const useAuthStatus = (): AuthStatusReturn => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getCachedProfile());
  const [isLoading, setIsLoading] = useState(true);

  const getUserInitials = useCallback((profile: UserProfile | null): string => {
    if (!profile?.firstName && !profile?.lastName) return '';
    const firstInitial = profile.firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = profile.lastName?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!isLoggedIn()) {
      setUserProfile(null);
      saveCachedProfile(null);
      return;
    }

    // Check if we have cached profile first
    const cachedProfile = getCachedProfile();
    if (cachedProfile) {
      // Use cached profile immediately
      setUserProfile(cachedProfile);
    }

    try {
      // Still fetch from API to update cache with latest data
      const response = await getUserProfile();
      const raw = response?.data as UserProfile | undefined;
      if (raw) {
        const profile: UserProfile = {
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          refId: raw.refId || '',
        };
        setUserProfile(profile);
        saveCachedProfile(profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If API fails but we have cached profile, keep using it
      if (!cachedProfile) {
        setUserProfile(null);
        saveCachedProfile(null);
      }
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    const loggedIn = isLoggedIn();
    setIsUserLoggedIn(loggedIn);

    if (loggedIn) {
      await fetchUserProfile();
    } else {
      setUserProfile(null);
    }
    setIsLoading(false);
  }, [fetchUserProfile]);

  const refreshAuthStatus = useCallback(async () => {
    clearUserProfileFetchCache();
    await checkAuthStatus();
    dispatchAuthChangeEvent();
  }, [checkAuthStatus]);

  const handleLogout = useCallback((options?: LogoutOptions) => {
    clearLocalStoragePreservingMobileAddresses();
    clearUserProfileFetchCache();
    saveCachedProfile(null); // Clear cached profile
    setIsUserLoggedIn(false);
    setUserProfile(null);
    dispatchAuthChangeEvent();
    const storePrefix = window.location.pathname.match(/^\/store\/[^/]+/)?.[0] || '';
    window.location.href = storePrefix || '/';
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userToken') {
        clearUserProfileFetchCache();
        void checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuthStatus]);

  useEffect(() => {
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, [checkAuthStatus]);

  const userInitials = getUserInitials(userProfile);

  return {
    isUserLoggedIn,
    userProfile,
    userInitials,
    isLoading,
    refreshAuthStatus,
    handleLogout,
  };
};
