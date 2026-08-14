import React from 'react';

const HeroSection = () => (
  <section style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: '#1e293b', color: 'white' }}>
    <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', fontWeight: 'bold' }}>Distri-Lauquen</h1>
    <p style={{ fontSize: '20px', maxWidth: '600px', margin: '0 auto', color: '#cbd5e1' }}>Su socio de confianza en repuestos para el automotor. Calidad y servicio garantizados.</p>
  </section>
);

const AboutSection = () => (
  <section id="quienes-somos" style={{ padding: '80px 20px', backgroundColor: '#fff' }}>
    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '36px', marginBottom: '20px', color: '#111827' }}>Quiénes Somos</h2>
      <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: '1.7' }}>
        Somos una empresa dedica a la venta de autopartes  en el rubro automotor con mas de 30 años de experiencia. Día a día buscando soluciones y brindando el mejor servicio a nuestros clientes.
      </p>
    </div>
  </section>
);

const ServicesSection = () => (
    <section id="que-hacemos" style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '36px', marginBottom: '40px', color: '#111827' }}>Lo que Hacemos</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontSize: '22px', color: '#1e293b', marginTop: 0 }}>Venta Mayorista</h3>
                    <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Proveemos a talleres y casas de repuestos con un extenso catálogo de productos de primeras marcas.</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontSize: '22px', color: '#1e293b', marginTop: 0 }}>Venta Minorista</h3>
                    <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Atención personalizada en nuestro local para clientes particulares que buscan la mejor calidad y precio.</p>
                </div>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontSize: '22px', color: '#1e293b', marginTop: 0 }}>Asesoramiento Técnico</h3>
                    <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Nuestro equipo de expertos está listo para ayudarte a encontrar el repuesto exacto que necesitas.</p>
                </div>
            </div>
        </div>
    </section>
);

const LocationSection = () => (
  <section id="ubicacion" style={{ padding: '80px 20px', backgroundColor: '#fff' }}>
    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '36px', marginBottom: '20px', color: '#111827' }}>Nuestra Ubicación</h2>
      <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '30px' }}>
        Visítenos en <strong>Av. Eva Perón 3810, C1407, Ciudad Autónoma de Buenos Aires.</strong>
      </p>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.978111933231!2d-58.4601886847698!3d-34.63002498045268!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc98f45e72173%3A0x893831365392c2a3!2sAv.%20Eva%20Per%C3%B3n%203810%2C%20C1407%20CABA!5e0!3m2!1ses-419!2sar!4v1660000000000"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </section>
);

const ContactSection = () => (
  <section id="contacto" style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '36px', marginBottom: '30px', textAlign: 'center', color: '#111827' }}>Formulario de Contacto</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input type="text" placeholder="Nombre Completo" required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }} />
        <input type="email" placeholder="Correo Electrónico" required style={{ padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }} />
        <textarea placeholder="Su mensaje..." required rows="6" style={{ padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical', fontSize: '16px' }}></textarea>
        <button type="submit" style={{ padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
          Enviar Mensaje
        </button>
      </form>
    </div>
  </section>
);

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <LocationSection />
      <ContactSection />
    </div>
  );
}