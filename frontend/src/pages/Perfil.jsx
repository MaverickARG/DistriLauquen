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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 80px)', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
          Mi Perfil
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px' }}>
          Aquí puedes ver y actualizar tus datos personales.
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Campos no editables */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#4b5563', marginBottom: '4px' }}>Nombre de Usuario</label>
            <div style={{ padding: '14px', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#6b7280' }}>{user.username}</div>
          </div>

          {/* Campos editables */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="apellido" style={{ display: 'block', color: '#4b5563', marginBottom: '4px' }}>Apellido</label>
            <input id="apellido" name="apellido" type="text" value={formData.apellido} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', color: '#4b5563', marginBottom: '4px' }}>Correo Electrónico</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="telefono" style={{ display: 'block', color: '#4b5563', marginBottom: '4px' }}>Teléfono</label>
            <input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="cuit" style={{ display: 'block', color: '#4b5563', marginBottom: '4px' }}>CUIT</label>
            <input id="cuit" name="cuit" type="text" value={formData.cuit} onChange={handleChange} required style={{ width: '100%', padding: '14px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }} />
          </div>

          {message && <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}
          {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} /><span>{error}</span></div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}