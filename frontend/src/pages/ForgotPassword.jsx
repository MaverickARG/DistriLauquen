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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
          Restablecer Contraseña
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px' }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} size={20} />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          {message && <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}
          {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} /><span>{error}</span></div>}

          <button type="submit" disabled={loading || !!message} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (loading || !!message) ? 0.7 : 1 }}>
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/clientes" style={{ color: '#4b5563', fontSize: '14px', textDecoration: 'underline' }}>
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}