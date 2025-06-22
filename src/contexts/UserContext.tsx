'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DbUser } from '@/lib/firebase-admin';

interface UserContextType {
  user: DbUser | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export default function UserProvider({ initialUser, loading, children }: { initialUser: DbUser | null, loading: boolean, children: ReactNode }) {
  const [user, setUser] = useState<DbUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(loading);

  const refreshUser = async () => {
    setIsLoading(true);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validateToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    setUser(data.user);
    setIsLoading(false);
  };

  // Listen for changes in the token cookie and refresh user context
  useEffect(() => {
    const interval = setInterval(() => {
      // Check for token cookie
      if (document.cookie.includes('token=')) {
        if (!user) refreshUser();
      } else {
        if (user) setUser(null);
      }
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
      if (!user) {
          refreshUser();
      }
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser, isLoading, setIsLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProviderClient');
  }
  return context;
};

// Helper to force refresh from anywhere
export const forceUserRefresh = (refreshUser: () => Promise<void>) => {
  refreshUser();
};
