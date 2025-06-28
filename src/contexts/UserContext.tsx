'use client';

import { createContext, useContext, ReactNode } from 'react';
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

  const refreshUser = async () => {
    await update();
  };

  const contextValue: UserContextType = {
    user: session?.user || null,
    isLoading: status === 'loading',
    setIsLoading: () => {}, // No-op since NextAuth handles loading state
    refreshUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export default function UserProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
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
