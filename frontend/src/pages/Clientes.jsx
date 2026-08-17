import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/AuthContext';

const apiUrl = import.meta.env.VITE_API_URL;
export default function Clientes() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Estado del formulario
  const [username, setUsername] = useState(''); // nombre de usuario (login)
  const [nombre, setNombre] = useState(''); // nombre real de la persona
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cuit, setCuit] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado de la UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Mostrar mensaje si se redirige desde una sesión expirada o usuario desactivado
    if (location.state?.message) {
      setError(location.state.message);
      return;
    }

    const message = new URLSearchParams(location.search).get('message');
    if (message) {
      setError(message);
    }
  }, [location]);

  const clearForm = () => {
    setUsername('');
    setNombre('');
    setApellido('');
    setTelefono('');
    setCuit('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const sanitizeUsername = (val) => {
    // permitir solo letras, números y guion bajo
    return String(val).replace(/[^a-zA-Z0-9_]/g, '');
  };

  const formatCuitForDisplay = (digits) => {
    // digits: string solo con números (máx 11)
    const a = digits.slice(0, 2);
    const b = digits.slice(2, 10);
    const c = digits.slice(10, 11);
    let out = '';
    if (a) out += a;
    if (b) out += '-' + b;
    if (c) out += '-' + c;
    return out;
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
      if (/\d/.test(nombre) || /\d/.test(apellido)) {
        setError('El nombre y el apellido no deben contener números.');
        return;
      }
      const normalizedCuit = String(cuit).replace(/\D/g, '');
      if (normalizedCuit.length !== 11) {
        setError('El CUIT debe contener 11 dígitos).');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    // En registro enviamos `username` (login) y también `nombre` para referencia
    let body;
    if (isLogin) {
      body = { username, password };
    } else {
      const normalizedCuit = String(cuit).replace(/\D/g, '').slice(0, 11);
      const formattedCuit = `${normalizedCuit.slice(0, 2)}-${normalizedCuit.slice(2, 10)}-${normalizedCuit.slice(10)}`;
      body = { username, apellido, telefono, cuit: formattedCuit, email, password, nombre };
    }

    try {
      const response = await fetch(`${apiUrl}${url}`, {
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
        }, 500); // Reducir el tiempo de espera para una mejor UX
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
          {/* Usuario (login) - ocupa ancho completo */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <User style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => {
                const clean = sanitizeUsername(e.target.value);
                setUsername(clean);
              }}
              required
              style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Solo letras, números y guion bajo.</div>
          </div>

          {/* Nombre y Apellido (registro) */}
          {!isLogin && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

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
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
              />
            </div>
          )}

          {/* Input de Contraseña con toggle mostrar/ocultar */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              style={{ width: '100%', padding: '14px 42px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '10px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }} aria-label="Mostrar contraseña">
              {showPassword ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
            </button>
          </div>

          {/* Input de Confirmar Contraseña (solo para registro) */}
          {!isLogin && (
            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 42px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(s => !s)} style={{ position: 'absolute', right: '10px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }} aria-label="Mostrar confirmar contraseña">
                {showConfirmPassword ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
              </button>
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