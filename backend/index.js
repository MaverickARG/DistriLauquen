const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Cargar catálogo en memoria al iniciar el servidor
const jsonPath = path.join(__dirname, 'repuestos_unificados.json');
let repuestos = [];

try {
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  repuestos = JSON.parse(rawData);
  console.log(`✅ Servidor listo: ${repuestos.length} repuestos cargados en memoria.`);
} catch (error) {
  console.error('❌ Error al cargar repuestos_unificados.json:', error.message);
}

// Ruta raíz para confirmar que el servidor está vivo
app.get('/', (req, res) => {
  res.send('<h1>API del Catálogo de Repuestos</h1><p>Servidor funcionando. Prueba el endpoint <a href="/api/health">/api/health</a>.</p>');
});

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', total_items: repuestos.length });
});

// Endpoint de búsqueda omnibox (busca en código, vehículo, descripción o categoría)
app.get('/api/buscar', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const limite = parseInt(req.query.limite) || 50;

  if (!query) {
    return res.json({ total: 0, resultados: [] });
  }

  // Dividimos la búsqueda por palabras (ej: "corsa semi eje")
  const palabras = query.split(' ').filter(p => p.length > 0);

  const filtrados = repuestos.filter(item => {
    const textoFila = item.datos_raw.join(' ').toLowerCase();
    const categoria = item.hoja_origen.toLowerCase();
    const todoElTexto = `${categoria} ${textoFila}`;

    // Debe coincidir con TODAS las palabras ingresadas
    return palabras.every(palabra => todoElTexto.includes(palabra));
  });

  res.json({
    total: filtrados.length,
    resultados: filtrados.slice(0, limite)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});