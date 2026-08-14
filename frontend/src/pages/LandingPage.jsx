import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import { Truck, ShoppingBag, Wrench, Mail, Phone, Clock, MessageSquare } from 'lucide-react';
import motorVideo from '@/assets/motor.mp4';
import brandsImage from '@/assets/brands.png';

// --- Sub-componentes para modularidad ---

const Hero = () => (
  <section className={styles.hero}>
    <div className={styles.heroOverlay}></div>
    <div className={styles.heroContent}>
      <h1 className={styles.title}>
        Todo lo que tu auto necesita,
        <br />
        <span className={styles.highlight}>en un solo lugar.</span>
      </h1>
      <p className={styles.description}>
        Somos líderes en la distribución de repuestos automotores de alta calidad. Con un extenso catálogo y un servicio eficiente, garantizamos la solución que buscás para tu vehículo.
      </p>
      <div className={styles.buttonGroup}>
        <Link to="/#contacto" className={styles.ctaPrimary}>HACÉ TU CONSULTA</Link>
        <Link to="/#quienes-somos" className={styles.ctaSecondary}>CONOCÉ MÁS</Link>
      </div>
    </div>
  </section>
);

const About = () => (
  <section id="quienes-somos" className={`${styles.section} ${styles.aboutSection}`}>
    <div className={styles.aboutContent}>
      <h2 className={styles.sectionTitle}>
        <span className={styles.highlight}>DistriLauquen:</span> Confianza y Calidad en cada repuesto
      </h2>
      <p className={styles.sectionDescription}>
        Somos una empresa dedicada a la venta de autopartes en el rubro automotor. Día a día buscando soluciones y brindando el mejor servicio a nuestros clientes.
      </p>
    </div>
    <div className={styles.aboutImageContainer}>
      <video 
        src={motorVideo} 
        autoPlay 
        loop 
        muted 
        playsInline 
        className={styles.aboutVideo} />
    </div>
  </section>
);

const Services = () => (
  <section id="que-hacemos" className={`${styles.section} ${styles.servicesSection}`}>
    <h2 className={styles.sectionTitle}>Nuestros Servicios</h2>
    <div className={styles.servicesGrid}>
      <div className={styles.serviceCard}>
        <Truck size={40} className={styles.serviceIcon} />
        <h3>Venta Mayorista</h3>
        <p>Proveemos a talleres y casas de repuestos con un extenso catálogo de productos de primeras marcas.</p>
      </div>
      <div className={styles.serviceCard}>
        <ShoppingBag size={40} className={styles.serviceIcon} />
        <h3>Venta Minorista</h3>
        <p>Atención personalizada en nuestro local para clientes particulares que buscan la mejor calidad y precio.</p>
      </div>
      <div className={styles.serviceCard}>
        <Wrench size={40} className={styles.serviceIcon} />
        <h3>Asesoramiento Técnico</h3>
        <p>Nuestro equipo de expertos está listo para ayudarte a encontrar el repuesto exacto que necesitas.</p>
      </div>
    </div>
  </section>
);

const Clients = () => (
  <section id="marcas" className={`${styles.section} ${styles.clientsSection}`}>
    <img src={brandsImage} alt="Marcas con las que trabajamos" className={styles.brandsImage} />
  </section>
);

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // La lógica de envío del formulario se conectaría aquí.
    // Por ahora, solo mostramos los datos en consola para verificar.
    console.log("Datos del formulario:", contactForm);
    alert("Formulario enviado (simulación). Revisa la consola.");
  };

  return (
    <>
      <Hero />
      <About />
      <Services />
      <Clients />

      <section id="ubicacion" className={`${styles.section} ${styles.locationSection}`}>
        <div className={styles.locationContent}>
          <h2 className={styles.sectionTitle}>Nuestra Ubicación</h2>
          <p className={styles.sectionDescription}>
            Visitanos en nuestro local para una atención personalizada.
          </p>
          <p className={styles.address}>
            Av. Eva Perón 3810 (CP: 1407)<br/>
            Parque Avellaneda, CABA, Argentina.
          </p>
          <a href="https://www.google.com/maps/place/Av.+Eva+Per%C3%B3n+3810,+C1407+CABA,+Argentina" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>
            VER EN MAPA
          </a>
        </div>
        <div className={styles.mapContainer}>
          <iframe
            title="Ubicación de DistriLauquen en Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.978111933231!2d-58.4601886847698!3d-34.63002498045268!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc98f45e72173%3A0x893831365392c2a3!2sAv.%20Eva%20Per%C3%B3n%203810%2C%20C1407%20CABA!5e0!3m2!1ses-419!2sar!4v1660000000000"
            width="100%"
            height="100%"
            className={styles.mapIframe}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      <section id="contacto" className={`${styles.section} ${styles.contactSection}`}>
        <div className={styles.contactInfo}>
          <h2 className={styles.sectionTitle}>Ponete en Contacto</h2>
          <p className={styles.sectionDescription}>
            Si necesitás un repuesto o querés realizar una consulta, no dudes en comunicarte con nosotros.
          </p>
          <div className={styles.contactDetails}>
            <a href="mailto:alcalderepuestos@hotmail.com" className={styles.contactLink}><Mail size={20} /> <span>alcalderepuestos@hotmail.com</span></a>
            <a href="tel:+541146131376" className={styles.contactLink}><Phone size={20} /> <span>(+54) 11 4613-1376 (Fijo)</span></a>
            <a href="tel:+541146120920" className={styles.contactLink}><Phone size={20} /> <span>(+54) 11 4612-0920 (Fijo)</span></a>
            <a href="https://wa.me/5491151566622" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
              <MessageSquare size={20} /> <span>(+54) 11 5156-6622 (WhatsApp)</span>
            </a>
          </div>
          <div className={styles.officeHours}>
            <h4><Clock size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Horarios de Atención</h4>
            <p>Lunes a Viernes: 08:00 a 13:00 y 14:00 a 18:00 hs</p>
            <p>Sábados: 08:00 a 13:00 hs</p>
          </div>
        </div>
        <form className={styles.contactForm} onSubmit={handleContactSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nombre Completo</label>
            <input type="text" id="name" name="name" required value={contactForm.name} onChange={handleContactChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input type="email" id="email" name="email" required value={contactForm.email} onChange={handleContactChange} />
          </div>
          <textarea name="message" placeholder="Escribe tu mensaje aquí..." required rows="6" value={contactForm.message} onChange={handleContactChange}></textarea>
          <button type="submit" className={styles.ctaPrimary}>Enviar Mensaje</button>
        </form>
      </section>
    </>
  );
}