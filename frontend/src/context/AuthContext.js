import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Central auth context avoids passing user/token through many props.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore previous session from local storage on app start.
    const bootstrap = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);

        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (err) {
        console.warn('Failed to restore auth state:', err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Login stores both memory state and persistent storage for app relaunch.
  const login = async (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    await Promise.all([
      AsyncStorage.setItem('token', nextToken),
      AsyncStorage.setItem('user', JSON.stringify(nextUser)),
    ]);
  };

  // Logout clears both memory state and local storage.
  const logout = async () => {
    setUser(null);
    setToken(null);
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('user'),
    ]);
  };

  // Memoized context value prevents unnecessary re-renders in consumers.
  const value = useMemo(
    () => ({ user, token, loading, isAuthenticated: Boolean(token), login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  // Guard helps catch incorrect usage outside provider quickly.
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
