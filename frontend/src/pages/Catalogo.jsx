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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Encabezado */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: 'var(--bg-black)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Catálogo de Repuestos</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Viendo precios para: <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.lista_precios}</span>
            </p>
          </div>
          
          {/* Controles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Selector de Margen de Ganancia */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-dark)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <DollarSign size={18} color="var(--brand-yellow)" />
              <span style={{ fontSize: '14px' }}>Margen: +</span>
              <input
                type="number"
                value={margen} 
                onChange={(e) => setMargen(Number(e.target.value))}
                style={{
                  backgroundColor: 'var(--bg-black)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--metal-gray)',
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
                  backgroundColor: modoCliente ? 'var(--brand-yellow)' : 'var(--metal-gray)',
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
          <Search style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--metal-gray)' }} size={20} />
          <input
            type="text"
            placeholder="Buscar por código, repuesto, vehículo (ej: 'corsa bomba agua', '1110', 'vth')..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              fontSize: '16px',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          />
          {cargando && (
            <RefreshCw style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--brand-yellow)', animation: 'spin 1s linear infinite' }} size={20} />
          )}
        </div>

        {/* Resumen de Resultados */}
        {busqueda && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
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
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '1px solid var(--border-color)',
                  transition: 'border-color 0.3s ease, transform 0.3s ease'
                }}
              >
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--brand-yellow)', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', border: '1px solid var(--border-color)' }}>
                      {item.hoja_origen}
                    </span>
                    <span style={{ color: 'var(--metal-gray)', fontSize: '12px' }}>Fila {item.fila_origen}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {detalle}
                  </p>
                </div>

                {/* Bloque de Precios */}
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: modoCliente ? 'none' : 'line-through', height: '18px' }}>
                    {modoCliente ? 'Costo: $*****' : `Costo: $${item.precio?.toLocaleString('es-AR')}`}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brand-yellow)' }}>
                    ${precioVenta.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            );
          })}

          {!cargando && busqueda && resultados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              <Package size={48} style={{ marginBottom: '12px', color: 'var(--metal-gray)' }} />
              <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)' }}>No se encontraron repuestos con ese término de búsqueda.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}