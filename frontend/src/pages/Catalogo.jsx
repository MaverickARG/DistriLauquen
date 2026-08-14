import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Package, Tag, Layers, RefreshCw } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [margen, setMargen] = useState(40); // 40% de ganancia por defecto
  const [modoCliente, setModoCliente] = useState(false); // Switch para ocultar costo

  // Petición a la API con debounce
  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([]);
      setTotal(0);
      return;
    }

    const timer = setTimeout(() => {
      buscarRepuestos();
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Redirigir si no está logueado
  useEffect(() => {
    if (!token) {
      navigate('/clientes');
    }
  }, [token, navigate]);

  const buscarRepuestos = async () => {
    if (!token) return; // No buscar si no hay token
    setCargando(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(busqueda)}&limite=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.status === 401) { // Token inválido o expirado
        logout();
        navigate('/clientes', { state: { message: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.' } });
      }
      setResultados(data.resultados || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error conectando con la API:", err);
    } finally {
      setCargando(false);
    }
  };

  const calcularPrecioVenta = (precioCosto) => {
    if (!precioCosto) return 0;
    const precio = parseFloat(precioCosto);
    return Math.round(precio * (1 + margen / 100));
  };

  if (!token || !user) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Redirigiendo al login...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Encabezado */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', color: '#fff' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🚗 Catálogo Interno</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
              Viendo precios para: <span style={{ fontWeight: 'bold', color: 'white' }}>{user.lista_precios}</span>
            </p>
          </div>
          
          {/* Controles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Selector de Margen de Ganancia */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#334155', padding: '8px 16px', borderRadius: '8px' }}>
              <DollarSign size={18} color="#4ade80" />
              <span style={{ fontSize: '14px' }}>Margen: +</span>
              <input
                type="number"
                value={margen} 
                onChange={(e) => setMargen(Number(e.target.value))}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontWeight: 'bold',
                  width: '60px'
                }}
              />
              <span style={{ fontSize: '14px' }}>%</span>
            </div>

            {/* Switch Modo Cliente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Modo Cliente</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={modoCliente} 
                  onChange={() => setModoCliente(!modoCliente)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: modoCliente ? '#22c55e' : '#475569',
                  transition: '.2s', borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '20px', width: '20px',
                    left: '2px', bottom: '2px', backgroundColor: 'white',
                    transition: '.2s', borderRadius: '50%',
                    transform: modoCliente ? 'translateX(20px)' : 'translateX(0)'
                  }}></span>
                </span>
              </label>
            </div>
          </div>
        </header>

        {/* Barra de Búsqueda */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} size={20} />
          <input
            type="text"
            placeholder="Buscar por código, repuesto, vehículo (ej: 'corsa bomba agua', '1110', 'vth')..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          />
          {cargando && (
            <RefreshCw style={{ position: 'absolute', right: '16px', top: '16px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} size={20} />
          )}
        </div>

        {/* Resumen de Resultados */}
        {busqueda && (
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            Mostrando <strong>{resultados.length}</strong> de <strong>{total}</strong> repuestos encontrados para "<em>{busqueda}</em>"
          </p>
        )}

        {/* Grilla de Resultados */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {resultados.map((item, index) => {
            const precioVenta = calcularPrecioVenta(item.precio);
            const detalle = item.datos_raw.join(' | ');

            return (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  borderLeft: '5px solid #3b82f6'
                }}
              >
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      {item.hoja_origen}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Fila {item.fila_origen}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '500' }}>
                    {detalle}
                  </p>
                </div>

                {/* Bloque de Precios */}
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textDecoration: modoCliente ? 'none' : 'line-through', height: '18px' }}>
                    {modoCliente ? 'Costo: $*****' : `Costo: $${item.precio?.toLocaleString('es-AR')}`}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>
                    ${precioVenta.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            );
          })}

          {!cargando && busqueda && resultados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Package size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '16px' }}>No se encontraron repuestos con ese término de búsqueda.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}