import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Users, Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
};

function Uploader({ title, description, listType }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' }); // idle, loading, success, error

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus({ type: 'idle', message: '' });
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Por favor, selecciona un archivo.' });
      return;
    }
    setStatus({ type: 'loading', message: 'Subiendo y procesando archivo...' });

    const formData = new FormData();
    formData.append('listaPrecios', file);

    try {
      const response = await fetchWithAuth(`/api/admin/upload-lista`, { // Endpoint unificado
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error en el servidor');
      setStatus({ type: 'success', message: '¡Lista de precios actualizada con éxito!' });
    } catch (error) {
      setStatus({ type: 'error', message: `Error: ${error.message}` });
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-black)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: 'var(--text-primary)' }}><Upload size={24} color="var(--brand-yellow)" /> {title}</h2>
      <p style={{ color: 'var(--text-secondary)', minHeight: '40px' }}>{description}</p>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input type="file" accept=".xlsx" onChange={handleFileChange} style={{
          border: '1px solid var(--border-color)',
          padding: '10px',
          borderRadius: '8px',
          flexGrow: 1,
          backgroundColor: 'var(--bg-dark)',
          color: 'var(--text-primary)'
        }} />
        <button onClick={handleUpload} disabled={status.type === 'loading'} style={{
          backgroundColor: 'var(--brand-yellow)', color: 'var(--bg-black)', border: 'none', padding: '12px 20px',
          borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {status.type === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {status.type === 'loading' ? 'Procesando...' : 'Actualizar'}
        </button>
      </div>
      {status.message && (
        <div style={{
          marginTop: '16px', padding: '12px', borderRadius: '8px', border: `1px solid ${status.type === 'error' ? '#ef4444' : '#22c55e'}`,
          color: status.type === 'error' ? '#fca5a5' : '#86efac',
          backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {status.type === 'error' ? <AlertTriangle /> : <CheckCircle />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}

function ClientManager() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchWithAuth('/api/admin/clientes');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al cargar clientes');
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleListChange = async (clientId, newPriceList) => {
    try {
      const response = await fetchWithAuth(`/api/admin/clientes/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify({ lista_precios: newPriceList }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar');
      // Actualizar la lista localmente para reflejar el cambio
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === clientId ? { ...client, lista_precios: newPriceList } : client
        )
      );
    } catch (error) {
      alert(`Error al actualizar: ${error.message}`);
    }
  };

  if (loading) return <div>Cargando clientes...</div>;
  if (error) return <div style={{ color: '#fca5a5' }}>Error: {error}</div>;

  return (
    <div style={{ backgroundColor: 'var(--bg-black)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: 'var(--text-primary)' }}><Users size={24} color="var(--brand-yellow)" /> Gestión de Clientes</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Nombre</th>
              <th style={{ padding: '12px' }}>Apellido</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Teléfono</th>
              <th style={{ padding: '12px' }}>CUIT</th>
              <th style={{ padding: '12px' }}>Rol</th>
              <th style={{ padding: '12px' }}>Lista de Precios</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{client.id}</td>
                <td style={{ padding: '12px' }}>{client.username}</td>
                <td style={{ padding: '12px' }}>{client.apellido}</td>
                <td style={{ padding: '12px' }}>{client.email}</td>
                <td style={{ padding: '12px' }}>{client.telefono}</td>
                <td style={{ padding: '12px' }}>{client.cuit}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                    backgroundColor: client.role === 'admin' ? 'var(--brand-yellow)' : 'var(--bg-dark)',
                    color: client.role === 'admin' ? 'var(--bg-black)' : 'var(--text-primary)'
                  }}>{client.role}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  {client.role === 'admin' ? (
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{client.lista_precios}</span>
                  ) : (
                    <select
                      value={client.lista_precios}
                      onChange={(e) => handleListChange(client.id, e.target.value)}
                      style={{ padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                    >
                      <option value="distribuidores">Distribuidores</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Panel de Administración</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--text-secondary)' }}>Herramientas para la gestión del sistema.</p>
        </header>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <Uploader title="Lista de Precios para Distribuidores" description="Sube el archivo (debe llamarse lista.xlsx) para actualizar los precios." listType="distribuidores" />
        </div>
        
        <ClientManager />

      </div>
    </div>
  );
}