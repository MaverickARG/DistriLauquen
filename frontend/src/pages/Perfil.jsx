import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/AuthContext';

export default function Perfil() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  const [formData, setFormData] = useState({
    apellido: '',
    telefono: '',
    cuit: '',
    email: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/clientes');
    } else if (user) {
      // Cargar datos del usuario en el formulario
      const fetchUserData = async () => {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('No se pudieron cargar los datos del usuario.');
          const fullUser = await res.json();
          setFormData({
            apellido: fullUser.apellido || '',
            telefono: fullUser.telefono || '',
            cuit: fullUser.cuit || '',
            email: fullUser.email || '',
          });
        } catch (err) {
          setError('Error al cargar tus datos. Intenta recargar la página.');
        }
      };
      fetchUserData();
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (/\d/.test(formData.apellido)) {
      setError('El apellido no debe contener números.');
      return;
    }
    if (!/^\d{2}-\d{8}-\d{1}$/.test(formData.cuit)) {
      setError('El formato del CUIT debe ser XX-XXXXXXXX-X.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('El formato del correo electrónico no es válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al actualizar el perfil.');
      }
      // Actualizar el token en el contexto para reflejar los cambios
      login(data.token);
      setMessage('¡Perfil actualizado con éxito!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-dark)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', padding: '40px', backgroundColor: 'var(--bg-black)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Mi Perfil
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Aquí puedes ver y actualizar tus datos personales.
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Campos no editables */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombre de Usuario</label>
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', color: 'var(--metal-gray)', border: '1px solid var(--border-color)' }}>{user.username}</div>
          </div>

          {/* Campos editables */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="apellido" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Apellido</label>
            <input id="apellido" name="apellido" type="text" value={formData.apellido} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Correo Electrónico</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="telefono" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>Teléfono</label>
            <input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="cuit" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '4px' }}>CUIT</label>
            <input id="cuit" name="cuit" type="text" value={formData.cuit} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
          </div>

          {message && <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #22c55e' }}>{message}</div>}
          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ef4444' }}><AlertCircle size={20} /><span>{error}</span></div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'var(--bg-black)', backgroundColor: 'var(--brand-yellow)', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}