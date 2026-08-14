import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';

export default function Header() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/clientes');
  };

  // Cerrar dropdown si se hace clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header style={{ 
      backgroundColor: '#fff', 
      padding: '15px 40px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#111827', fontSize: '24px', fontWeight: 'bold' }}>
        🚗 DistriLauquen
      </Link>
      <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        {isLandingPage ? (
          <>
            <a href="#quienes-somos" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500' }}>Quiénes Somos</a>
            <a href="#que-hacemos" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500' }}>Qué Hacemos</a>
            <a href="#ubicacion" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500' }}>Ubicación</a>
            <a href="#contacto" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500' }}>Contacto</a>
          </>
        ) : (
          <Link to="/" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: '500' }}>Volver al Inicio</Link>
        )}

        {user && user.role === 'admin' && (
          <Link to="/admin" style={{ textDecoration: 'none', color: '#be123c', fontWeight: 'bold' }}>
            Admin Panel
          </Link>
        )}

        {user ? (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              color: '#4b5563', fontWeight: '500'
            }}>
              Hola, <strong>{user.username}</strong>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isDropdownOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '120%',
                backgroundColor: 'white', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '200px', zIndex: 10,
                border: '1px solid #e5e7eb',
                padding: '8px 0'
              }}>
                <Link to="/perfil" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '10px 16px', color: '#374151', textDecoration: 'none' }}>Mi Perfil</Link>
                <Link to="/change-password" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '10px 16px', color: '#374151', textDecoration: 'none' }}>Cambiar Contraseña</Link>
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }}></div>
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'
                }}>Cerrar Sesión</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/clientes" style={{ 
            textDecoration: 'none', 
            color: '#fff', 
            backgroundColor: '#2563eb', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            fontWeight: 'bold' 
          }}>
            Clientes
          </Link>
        )}
      </nav>
    </header>
  );
}