import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Package, Tag, Layers, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { useNavigate } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL;

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(false);
  // ancho dinámico del input de página según la cantidad de dígitos de totalPages
  const pageInputWidth = `${Math.max(48, 18 + String(totalPages).length * 12)}px`;
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [margen, setMargen] = useState(0); // arrancar en 0%
  const [showMargenControl, setShowMargenControl] = useState(true); // disponible para todos los usuarios

  const sanitizeMarginInput = (raw) => {
    // raw es string desde e.target.value; eliminamos todo excepto dígitos y - opcional
    if (raw === '' || raw === undefined || raw === null) return 0;
    // quitar espacios y caracteres no numéricos (permitimos sólo dígitos)
    let s = String(raw).replace(/[^0-9]/g, '');
    // eliminar ceros a la izquierda; si queda vacío, dejar '0'
    s = s.replace(/^0+/, '');
    if (s === '') s = '0';
    const n = parseInt(s, 10);
    if (isNaN(n) || n < 0) return 0;
    return n;
  };

  // Petición a la API con debounce
  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([]);
      setTotal(0);
      setPagina(1);
      setTotalPages(1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      buscarRepuestos(pagina, controller.signal);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busqueda, pagina]);

  // Redirigir si no está logueado
  useEffect(() => {
    if (!token) {
      navigate('/clientes');
    }
  }, [token, navigate]);

  const buscarRepuestos = async (paginaReq = 1, signal) => {
    if (!token) return; // No buscar si no hay token
    setCargando(true);
    try {
      const res = await fetch(`${apiUrl}/api/buscar?q=${encodeURIComponent(busqueda)}&limite=100&pagina=${paginaReq}`, {
        signal,
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
      setPagina(data.pagina || 1);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error conectando con la API:", err);
      }
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
          </div>
          
          {/* Controles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Icono tipo 'ocultar saldo' para mostrar/ocultar el control de margen (solo admins) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px', borderRadius: '8px' }}>
              <button
                title={showMargenControl ? 'Ocultar control de margen' : 'Mostrar control de margen'}
                onClick={() => setShowMargenControl(s => !s)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer'
                }}
              >
                {showMargenControl ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {/* Selector de Margen de Ganancia */}
            {showMargenControl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-dark)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <DollarSign size={18} color="var(--brand-yellow)" />
              <span style={{ fontSize: '14px' }}>Agregar margen</span>
              <input
                type="number"
                value={margen}
                onChange={(e) => {
                  const cleaned = sanitizeMarginInput(e.target.value);
                  setMargen(cleaned);
                }}
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
            )}
            {/* switch eliminado */}
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
            Mostrando <strong>{resultados.length}</strong> de <strong>{total}</strong> repuestos encontrados para "<em>{busqueda}</em>" (Página {pagina} de {totalPages})
          </p>
        )}

        {/* Grilla de Resultados */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {resultados.map((item, index) => {
            const precioVenta = calcularPrecioVenta(item.precio);
            const marca = item.marca || item.hoja_origen;
            const codigoTercero = item.codigo_tercero
              || item.codigoTercero
              || item.cod_tercero
              || (Array.isArray(item.datos_raw) ? item.datos_raw[0] : null)
              || (Array.isArray(item.datos_raw) ? item.datos_raw[1] : null);
            const codigoPrincipal = item.codigo
              || (item.hoja_origen ? item.hoja_origen.slice(0, 3).toUpperCase() : null);

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
                  {/* Fila superior con marca y código tercero */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {marca && (
                      <span style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--brand-yellow)', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        {marca}
                      </span>
                    )}
                    {marca && codigoTercero && <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>-</span>}
                    {codigoTercero && (
                      <span style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        {codigoTercero}
                      </span>
                    )}
                  </div>

                  {/* Descripción principal */}
                  <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500', marginBottom: '4px' }}>
                    {item.descripcion || 'Sin descripción'}
                  </p>
                  {codigoPrincipal && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--metal-gray)', fontFamily: 'monospace' }}>
                      {codigoPrincipal}
                    </p>
                  )}
                </div>

                {/* Bloque de Precios */}
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brand-yellow)' }}>
                    ${precioVenta.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                aria-label="Anterior"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-dark)', cursor: pagina <= 1 ? 'not-allowed' : 'pointer', opacity: pagina <= 1 ? 0.45 : 1
                }}
              >
                <ChevronLeft size={22} color="var(--brand-yellow)" />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <span>Página</span>
                <input
                  type="number"
                  value={pagina}
                  min={1}
                  max={totalPages}
                  onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setPagina(Math.max(1, Math.min(totalPages, v))); }}
                  style={{ width: pageInputWidth, textAlign: 'center', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <span>de {totalPages}</span>
              </div>

              <button
                onClick={() => setPagina(p => Math.min(totalPages, p + 1))}
                disabled={pagina >= totalPages}
                aria-label="Siguiente"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-dark)', cursor: pagina >= totalPages ? 'not-allowed' : 'pointer', opacity: pagina >= totalPages ? 0.45 : 1
                }}
              >
                <ChevronRight size={22} color="var(--brand-yellow)" />
              </button>
            </div>
          )}

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