import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('eventease_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem('eventease_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('eventease_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const { token: authToken, user: authUser } = response.data;
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('eventease_token', authToken);
    localStorage.setItem('eventease_user', JSON.stringify(authUser));
    return response;
  };

  const requestLoginOtp = (payload) => api.post('/auth/otp/login/request', payload);

  const loginWithOtp = async (payload) => {
    const response = await api.post('/auth/otp/login/verify', payload);
    const { token: authToken, user: authUser } = response.data;
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('eventease_token', authToken);
    localStorage.setItem('eventease_user', JSON.stringify(authUser));
    return response;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const { token: authToken, user: authUser } = response.data;
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('eventease_token', authToken);
    localStorage.setItem('eventease_user', JSON.stringify(authUser));
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eventease_token');
    localStorage.removeItem('eventease_user');
  };

  const value = useMemo(
    () => ({ user, token, loading, login, requestLoginOtp, loginWithOtp, register, logout, setUser }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
