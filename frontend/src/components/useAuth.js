import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const [auth, setAuth] = useState({ token: null, user: null });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
        } else {
          setAuth({ token, user: decoded.user });
        }
      } catch (e) {
        console.error("Token inválido", e);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuth({ token: null, user: null });
    window.location.href = '/clientes'; // Redirect to login
  }, []);

  return { ...auth, logout };
};