import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/AuthContext';

export default function Clientes() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Estado del formulario
  const [username, setUsername] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cuit, setCuit] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estado de la UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Mostrar mensaje si se redirige desde una sesión expirada
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

  const clearForm = () => {
    setUsername('');
    setApellido('');
    setTelefono('');
    setCuit('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    clearForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validación del lado del cliente
    if (!isLogin) {
      if (/\d/.test(username) || /\d/.test(apellido)) {
        setError('El nombre y el apellido no deben contener números.');
        return;
      }
      if (!/^\d{2}-\d{8}-\d{1}$/.test(cuit)) {
        setError('El formato del CUIT debe ser XX-XXXXXXXX-X.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { username, password } : { username, apellido, telefono, cuit, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error inesperado.');
      }

      if (isLogin) {
        const user = login(data.token); // Usamos la función del contexto
        setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
          // Redirigir según el rol del usuario
          if (user.role === 'admin') navigate('/admin');
          else navigate('/catalogo');
        }, 1000);
      } else {
        setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
        handleSwitchMode(); // Cambiamos al modo login
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-dark)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '450px', padding: '40px', backgroundColor: 'var(--bg-black)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
          {isLogin ? 'Acceso Clientes' : 'Crear Cuenta'}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Ingresa tu usuario y contraseña.' : 'Completa tus datos para registrarte.'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Fila de Nombre y Apellido */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
              <input
                type="text"
                placeholder={isLogin ? "Nombre de usuario" : "Nombre"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
              />
            </div>
            {!isLogin && (
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
          </div>

          {/* Fila de Teléfono y CUIT (solo para registro) */}
          {!isLogin && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="CUIT (XX-XXXXXXXX-X)"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          {/* Input de Email (solo para registro) */}
          {!isLogin && (
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
              <input
                type="email"
                placeholder="Correo (para recuperación)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {/* Input de Contraseña */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Input de Confirmar Contraseña (solo para registro) */}
          {!isLogin && (
            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ef4444' }}><AlertCircle size={20} /><span>{error}</span></div>}
          {success && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #22c55e' }}>{success}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'var(--bg-black)', backgroundColor: 'var(--brand-yellow)', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarme')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={handleSwitchMode} style={{ background: 'none', border: 'none', color: 'var(--brand-yellow)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
          {isLogin && (
            <div style={{ marginTop: '16px' }}>
              <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'underline' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}