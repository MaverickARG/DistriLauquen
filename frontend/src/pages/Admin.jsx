import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Users, Save, AlertTriangle, CheckCircle, RefreshCw, Edit2, Trash2, Key } from 'lucide-react';

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
  const [editingClientId, setEditingClientId] = useState(null);
  const [editedClient, setEditedClient] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ username: '', nombre: '', apellido: '', email: '', telefono: '', cuit: '', password: '' });

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: 0 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--text-primary)' }}><Users size={24} color="var(--brand-yellow)" /> Gestión de Clientes</h2>
        <div>
          <button onClick={() => setShowAddForm(s => !s)} style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--bg-black)', border: 'none', padding: '10px 12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{showAddForm ? 'Cerrar' : 'Agregar Cliente'}</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {showAddForm && (
          <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: 'var(--bg-black)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <input placeholder="Usuario" value={newClientData.username} onChange={(e) => setNewClientData(prev => ({ ...prev, username: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
              <input placeholder="Nombre" value={newClientData.nombre} onChange={(e) => setNewClientData(prev => ({ ...prev, nombre: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
              <input placeholder="Apellido" value={newClientData.apellido} onChange={(e) => setNewClientData(prev => ({ ...prev, apellido: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <input placeholder="Email" value={newClientData.email} onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
              <input placeholder="Teléfono" value={newClientData.telefono} onChange={(e) => setNewClientData(prev => ({ ...prev, telefono: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
              <input placeholder="CUIT" value={newClientData.cuit} onChange={(e) => setNewClientData(prev => ({ ...prev, cuit: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <input placeholder="Contraseña" type="password" value={newClientData.password} onChange={(e) => setNewClientData(prev => ({ ...prev, password: e.target.value }))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '280px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
              <button onClick={async () => {
                // Validaciones mínimas
                if (!newClientData.username || !newClientData.apellido || !newClientData.email || !newClientData.password) return alert('Usuario, apellido, email y contraseña son requeridos.');
                try {
                  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClientData) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Error al crear cliente');
                  // Refrescar lista de clientes
                  await fetchClients();
                  setShowAddForm(false);
                  setNewClientData({ username: '', nombre: '', apellido: '', email: '', telefono: '', cuit: '', password: '' });
                  alert('Cliente creado con éxito.');
                } catch (err) { alert(`Error: ${err.message}`); }
              }} style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--bg-black)', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Crear</button>
            </div>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px' }}>Usuario</th>
              <th style={{ padding: '12px' }}>Nombre</th>
              <th style={{ padding: '12px' }}>Apellido</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Teléfono</th>
              <th style={{ padding: '12px' }}>CUIT</th>
              <th style={{ padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <React.Fragment key={client.id}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>{client.username}</td>
                  <td style={{ padding: '12px' }}>{client.nombre || ''}</td>
                  <td style={{ padding: '12px' }}>{client.apellido}</td>
                  <td style={{ padding: '12px' }}>{client.email}</td>
                  <td style={{ padding: '12px' }}>{client.telefono}</td>
                  <td style={{ padding: '12px' }}>{client.cuit}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => { setEditingClientId(client.id); setEditedClient({ ...client }); setNewPassword(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }} title="Editar">
                      <Edit2 size={18} color="var(--brand-yellow)" />
                    </button>
                    <button onClick={async () => {
                      if (!confirm(`Eliminar al usuario ${client.username}? Esta acción es irreversible.`)) return;
                      try {
                        const res = await fetchWithAuth(`/api/admin/clientes/${client.id}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Error al eliminar');
                        setClients(prev => prev.filter(c => c.id !== client.id));
                        alert('Usuario eliminado.');
                      } catch (err) {
                        alert(`Error: ${err.message}`);
                      }
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Eliminar">
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </td>
                </tr>

                {editingClientId === client.id && (
                  <tr>
                    <td colSpan={6} style={{ padding: '12px', backgroundColor: 'var(--bg-black)' }}>
                      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Usuario</label>
                            <input value={editedClient.username} readOnly style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Nombre</label>
                            <input value={editedClient.nombre || ''} onChange={(e) => setEditedClient(prev => ({ ...prev, nombre: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Apellido</label>
                            <input value={editedClient.apellido || ''} onChange={(e) => setEditedClient(prev => ({ ...prev, apellido: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Email</label>
                            <input value={editedClient.email || ''} onChange={(e) => setEditedClient(prev => ({ ...prev, email: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Teléfono</label>
                            <input value={editedClient.telefono || ''} onChange={(e) => setEditedClient(prev => ({ ...prev, telefono: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>CUIT</label>
                            <input value={editedClient.cuit || ''} onChange={(e) => setEditedClient(prev => ({ ...prev, cuit: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                          </div>
                          <div style={{ width: '260px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Nueva contraseña</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                              <button onClick={async () => {
                                if (!newPassword) return alert('Ingresa una contraseña nueva de al menos 6 caracteres.');
                                try {
                                  const res = await fetchWithAuth(`/api/admin/clientes/${client.id}/password`, { method: 'POST', body: JSON.stringify({ newPassword }), });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.message || 'Error al actualizar contraseña');
                                  alert('Contraseña cambiada.');
                                  setNewPassword('');
                                } catch (err) { alert(`Error: ${err.message}`); }
                              }} style={{ background: 'var(--brand-yellow)', border: 'none', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer' }} title="Cambiar contraseña"><Key size={16} /></button>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button onClick={() => { setEditingClientId(null); setEditedClient(null); setNewPassword(''); }} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                          <button onClick={async () => {
                            // Guardar cambios de perfil
                            try {
                              const payload = { nombre: editedClient.nombre || '', apellido: editedClient.apellido || '', telefono: editedClient.telefono || '', cuit: editedClient.cuit || '', email: editedClient.email || '' };
                              const res = await fetchWithAuth(`/api/admin/clientes/${client.id}/profile`, { method: 'PUT', body: JSON.stringify(payload) });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || 'Error al guardar');
                              setClients(prev => prev.map(c => c.id === client.id ? ({ ...c, ...data.user }) : c));
                              alert('Cambios guardados.');
                              setEditingClientId(null);
                            } catch (err) { alert(`Error: ${err.message}`); }
                          }} style={{ background: 'var(--brand-yellow)', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Guardar cambios</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
        <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Panel de Administración</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--text-secondary)' }}>Herramientas para la gestión del sistema.</p>
          </div>
          <div>
              <Link to="/catalogo" style={{ textDecoration: 'none' }}>
                <button style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--bg-black)', border: 'none', padding: '14px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', minWidth: '140px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}>
                  Ir al Catálogo
                </button>
              </Link>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <Uploader title="Lista de Precios para Distribuidores" description="Sube el archivo (debe llamarse lista.xlsx) para actualizar los precios." listType="distribuidores" />
        </div>
        
        <ClientManager />

      </div>
    </div>
  );
}