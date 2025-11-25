 import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
 export const AuthContext = createContext();
 export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);
  async function login(credentials) {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }
  async function register(payload) {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
 }