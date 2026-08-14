import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/AuthContext';

const AdminRoute = () => {
  const { user, token } = useAuth();

  // If still loading auth state, show a loader
  if (token && !user) {
      return <div>Verificando acceso...</div>;
  }

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/clientes" replace />;
  }

  // If user is not an admin, redirect to catalog
  if (user.role !== 'admin') {
    return <Navigate to="/catalogo" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;