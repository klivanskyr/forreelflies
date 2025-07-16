'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface UserContextType {
  user: Session['user'] | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function UserContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const lastRefreshRef = useRef<number>(0);

  const refreshUser = useCallback(async () => {
    const now = Date.now();
    // Prevent refreshing more frequently than every 2 seconds
    if (now - lastRefreshRef.current < 2000) {
      console.log('Skipping refreshUser call - too frequent');
      return;
    }
    
    lastRefreshRef.current = now;
    console.log('Refreshing user session...');
    await update();
  }, [update]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: session?.user || null,
    isLoading: status === 'loading',
    setIsLoading: () => {}, // No-op since NextAuth handles loading state
    refreshUser,
  }), [session?.user, status, refreshUser]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export default function UserProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60 * 1000} 
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <UserContextProvider>
        {children}
      </UserContextProvider>
    </SessionProvider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Helper to force refresh from anywhere
export const forceUserRefresh = (refreshUser: () => Promise<void>) => {
  refreshUser();
};
