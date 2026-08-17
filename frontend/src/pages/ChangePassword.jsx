import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/AuthContext';

const apiUrl = import.meta.env.VITE_API_URL;
export default function ChangePassword() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/clientes');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error.');
      }
      setMessage(data.message + ' Se cerrará la sesión por seguridad en 3 segundos...');
      setTimeout(() => {
        logout();
        navigate('/clientes', { state: { message: 'Inicia sesión con tu nueva contraseña.' } });
      }, 3000);
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
          Cambiar Contraseña
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Actualiza tu contraseña de acceso.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input type="password" placeholder="Nueva Contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>

          {message && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #22c55e' }}>{message}</div>}
          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ef4444' }}><AlertCircle size={20} /><span>{error}</span></div>}

          <button type="submit" disabled={loading || !!message} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'var(--bg-black)', backgroundColor: 'var(--brand-yellow)', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (loading || !!message) ? 0.7 : 1 }}>
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}