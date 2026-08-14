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
      const response = await fetchWithAuth(`/api/admin/upload-lista/${listType}`, {
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
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: 1 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}><Upload size={24} /> {title}</h2>
      <p style={{ color: '#64748b', minHeight: '40px' }}>{description}</p>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input type="file" accept=".xlsx" onChange={handleFileChange} style={{
          border: '1px solid #cbd5e1',
          padding: '10px',
          borderRadius: '8px',
          flexGrow: 1
        }} />
        <button onClick={handleUpload} disabled={status.type === 'loading'} style={{
          backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 20px',
          borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {status.type === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {status.type === 'loading' ? 'Procesando...' : 'Actualizar'}
        </button>
      </div>
      {status.message && (
        <div style={{
          marginTop: '16px', padding: '12px', borderRadius: '8px',
          color: status.type === 'error' ? '#991b1b' : '#14532d',
          backgroundColor: status.type === 'error' ? '#fecaca' : '#dcfce7',
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
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}><Users size={24} /> Gestión de Clientes</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
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
              <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{client.id}</td>
                <td style={{ padding: '12px' }}>{client.username}</td>
                <td style={{ padding: '12px' }}>{client.apellido}</td>
                <td style={{ padding: '12px' }}>{client.email}</td>
                <td style={{ padding: '12px' }}>{client.telefono}</td>
                <td style={{ padding: '12px' }}>{client.cuit}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                    backgroundColor: client.role === 'admin' ? '#dbeafe' : '#e0e7ff',
                    color: client.role === 'admin' ? '#1e40af' : '#3730a3'
                  }}>{client.role}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  {client.role === 'admin' ? (
                    <span style={{ fontWeight: '500' }}>{client.lista_precios}</span>
                  ) : (
                    <select
                      value={client.lista_precios}
                      onChange={(e) => handleListChange(client.id, e.target.value)}
                      style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                      <option value="finales">Finales</option>
                      <option value="mecanicos">Mecánicos</option>
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>Panel de Administración</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#64748b' }}>Herramientas para la gestión del sistema.</p>
        </header>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <Uploader title="Lista para Mecánicos" description="Sube el archivo (debe llamarse distribuidor.xlsx) para actualizar los precios de mecánicos/distribuidores." listType="mecanicos" />
          <Uploader title="Lista para Clientes Finales" description="Sube el archivo (debe llamarse final.xlsx) para actualizar los precios para el público general." listType="finales" />
        </div>
        
        <ClientManager />

      </div>
    </div>
  );
}