import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { fetchWithAuth } from './fetchWithAuth.js';
import styles from './Header.module.css';
import { Menu, X, Bell } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const navLinks = [
  { name: 'Inicio', path: '/' },
  { name: 'Nosotros', path: '/#quienes-somos' },
  { name: 'Marcas', path: '/#marcas' },
  { name: 'Contacto', path: '/#contacto' },
];

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [pendingCount, setPendingCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/clientes');
  };

  const handleHomeClick = (e) => {
    // Si ya estamos en la página de inicio (sin hash), el router no navegará.
    // Forzamos el scroll al top manualmente para este caso.
    if (location.pathname === '/' && !location.hash) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    handleNavClick();
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
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

  // Cerrar menús y manejar el scroll al cambiar de ruta
  useEffect(() => {
    handleNavClick();

    // Si hay un hash en la URL (ej: /#contacto), hacemos scroll a esa sección.
    if (location.hash) {
      const id = location.hash.substring(1);
      // Usamos un pequeño timeout para asegurar que la sección se haya renderizado,
      // especialmente si venimos de otra página.
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Si no hay hash, siempre hacemos scroll al principio de la página al navegar.
      window.scrollTo(0, 0);
    }
  }, [location]);

  // Obtener usuarios pendientes si el usuario es admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchPendingCount = async () => {
        try {
          const data = await fetchWithAuth('/api/admin/pending-count');
          setPendingCount(data.pendingCount || 0);
        } catch (error) {
          console.error("Error fetching pending users count:", error);
        }
      };

      fetchPendingCount(); // Llamada inicial
      const interval = setInterval(fetchPendingCount, 60000); // Consultar cada 60 segundos

      return () => clearInterval(interval); // Limpiar el intervalo al desmontar
    }
  }, [user]);

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logoLink} onClick={handleHomeClick}>
        <img src={logoImage} alt="DistriLauquen Logo" className={styles.logoImage} />
      </Link>

      <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.open : ''}`}>
        {navLinks.map(link => (
          <NavLink 
            key={link.name} 
            to={link.path} 
            className={({ isActive }) => (isActive && link.path === location.pathname) ? styles.active : ''}
            onClick={link.path === '/' ? handleHomeClick : handleNavClick}
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        {user?.role === 'admin' && (
          <Link to="/admin" className={styles.notificationBell} title={`${pendingCount} usuarios pendientes`}>
            <Bell />
            {pendingCount > 0 && (
              <span className={styles.notificationBadge}>
                {pendingCount}
              </span>
            )}
          </Link>
        )}

        {user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!isDropdownOpen)} className={styles.userButton}>
                Hola, <strong>{user.username}</strong>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}>
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdown}>
                  {user.role === 'admin' && <Link to="/admin" onClick={handleNavClick} className={styles.dropdownItem}>Admin Panel</Link>}
                  <Link to="/perfil" onClick={handleNavClick} className={styles.dropdownItem}>Mi Perfil</Link>
                  <Link to="/change-password" onClick={handleNavClick} className={styles.dropdownItem}>Cambiar Contraseña</Link>
                  <div className={styles.divider}></div>
                  <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutButton}`}>Cerrar Sesión</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/clientes" className={styles.ctaButton}>
              Acceso Clientes
            </Link>
          )}

        <button className={styles.hamburger} onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}