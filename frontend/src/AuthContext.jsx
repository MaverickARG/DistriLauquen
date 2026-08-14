import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// 1. Crear el Contexto
const AuthContext = createContext(null);

// 2. Crear el Proveedor del Contexto
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ token: null, user: null });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
        } else {
          setAuth({ token, user: decoded.user });
        }
      } catch (e) {
        console.error("Token inválido al iniciar:", e);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token) => {
    const decoded = jwtDecode(token);
    localStorage.setItem('token', token);
    setAuth({ token, user: decoded.user });
    return decoded.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuth({ token: null, user: null });
  }, []);

  const value = { ...auth, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Crear el Hook para consumir el contexto
export const useAuth = () => {
  return useContext(AuthContext);
};