import React from 'react';

export default function Footer() {
  return (
    <footer style={{ 
      backgroundColor: '#111827', 
      color: '#d1d5db', 
      textAlign: 'center', 
      padding: '40px 20px',
      marginTop: 'auto'
    }}>
      <p>&copy; {new Date().getFullYear()} DistriLauquen. Todos los derechos reservados.</p>
      <p>Av. Eva Perón 3810, C1407 CABA</p>
    </footer>
  );
}