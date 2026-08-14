import React, { useState } from 'react';
import { Mail, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error.');
      }
      setMessage(data.message);
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
          Restablecer Contraseña
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        
        <form onSubmit={handleSubmit}>
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

          {message && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #22c55e' }}>{message}</div>}
          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ef4444' }}><AlertCircle size={20} /><span>{error}</span></div>}

          <button type="submit" disabled={loading || !!message} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'var(--bg-black)', backgroundColor: 'var(--brand-yellow)', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (loading || !!message) ? 0.7 : 1 }}>
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/clientes" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'underline' }}>
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}