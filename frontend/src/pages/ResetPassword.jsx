import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;
export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error.');
      }
      setMessage(data.message + ' Serás redirigido en 3 segundos...');
      setTimeout(() => navigate('/clientes'), 3000);
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
          Nueva Contraseña
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Ingresa tu nueva contraseña.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--metal-gray)' }} size={20} />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
          </div>

          {message && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #22c55e' }}>{message}</div>}
          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ef4444' }}><AlertCircle size={20} /><span>{error}</span></div>}

          <button type="submit" disabled={loading || !!message} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'var(--bg-black)', backgroundColor: 'var(--brand-yellow)', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (loading || !!message) ? 0.7 : 1 }}>
            {loading ? 'Guardando...' : 'Guardar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}