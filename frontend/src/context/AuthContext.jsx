import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      console.error('Session check failed', err);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (username, password) => {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
