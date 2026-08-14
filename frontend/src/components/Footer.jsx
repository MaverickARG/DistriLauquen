import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import logoImage from '@/assets/logo.png';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <Link to="/" className={styles.logoLink}>
            <img src={logoImage} alt="DistriLauquen Logo" className={styles.logoImage} />
          </Link>
          <p className={styles.tagline}>Tu socio de confianza en repuestos para el automotor.</p>
          <div className={styles.divider}></div>
          <div className={styles.socialIcons}>
            <a href="https://www.instagram.com/distri.lauquen/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de DistriLauquen">
              <Instagram size={24} />
            </a>
            <a href="https://www.facebook.com/distrilauquenrepuestos/?locale=es_LA" target="_blank" rel="noopener noreferrer" aria-label="Facebook de DistriLauquen">
              <Facebook size={24} />
            </a>
          </div>
        </div>
        <div className={styles.footerLinks}>
          <h4>Navegación</h4>
          <nav className={styles.footerNav}>
            <Link to="/">Inicio</Link>
            <Link to="/#quienes-somos">Nosotros</Link>
            <Link to="/#marcas">Marcas</Link>
            <Link to="/#contacto">Contacto</Link>
          </nav>
        </div>
        <div className={styles.footerContact}>
          <h4>Contacto</h4>
          <p><MapPin size={16} /> Av. Eva Perón 3810, CABA</p>
          <p><Mail size={16} /> alcalderepuestos@hotmail.com</p>
          <p><Phone size={16} /> (+54) 11 4613-1376</p>
          <p><Phone size={16} /> (+54) 11 4612-0920</p>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>&copy; {currentYear} DistriLauquen. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;