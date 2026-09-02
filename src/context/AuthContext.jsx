import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    desc: 'Full system control, pricing & admins',
    email: 'admin@dairy.com',
    password: 'Admin@12345',
    color: '#3b82f6'
  },
  {
    role: 'ADMIN',
    title: 'Admin A (Rajesh)',
    desc: 'Assigned customers: Rahul, Priya, Amit',
    email: 'admin.rajesh@dairy.com',
    password: 'Admin@12345',
    color: '#10b981'
  },
  {
    role: 'ADMIN',
    title: 'Admin B (Sunil)',
    desc: 'Assigned customers: Vikram, Sneha, Ankit',
    email: 'admin.sunil@dairy.com',
    password: 'Admin@12345',
    color: '#8b5cf6'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        api.setToken(null);
        setUser(null);
      }
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.data?.token) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const quickLogin = async (account) => {
    return login(account.email, account.password);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore error on logout
    } finally {
      api.setToken(null);
      setUser(null);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const value = {
    user,
    role: user?.role,
    isSuperAdmin,
    isAdmin,
    loading,
    login,
    quickLogin,
    logout,
    refreshUser: fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
