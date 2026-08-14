import React from 'react';
import styles from './WhatsAppButton.module.css';

const WhatsAppButton = () => {
  const phoneNumber = "5491151566622";
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <a
      href={whatsappUrl}
      className={styles.whatsappButton}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      {/* SVG del logo de WhatsApp */}
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.57 2.427 15.07 3.18 16.42L2 22L7.75 20.88C9.07 21.58 10.5 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 20.5C10.67 20.5 9.38 20.15 8.28 19.52L7.88 19.29L4.29 20.19L5.22 16.71L4.97 16.3C4.32 15.18 4 13.63 4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12C20 16.418 16.418 20.5 12 20.5ZM16.95 14.32C16.75 14.22 15.95 13.82 15.75 13.72C15.55 13.62 15.4 13.57 15.25 13.82C15.1 14.07 14.6 14.67 14.45 14.82C14.3 14.97 14.15 14.97 13.95 14.87C13.75 14.77 13.05 14.52 12.2 13.77C11.55 13.22 11.1 12.52 10.95 12.27C10.8 12.02 10.9 11.87 11 11.77C11.1 11.67 11.25 11.52 11.35 11.37C11.45 11.27 11.5 11.17 11.6 10.97C11.7 10.77 11.65 10.62 11.6 10.52C11.55 10.42 11.05 9.17 10.85 8.67C10.65 8.17 10.45 8.22 10.3 8.22H10.1C9.95 8.22 9.75 8.27 9.55 8.47C9.35 8.67 8.8 9.17 8.8 10.17C8.8 11.17 9.55 12.12 9.7 12.32C9.85 12.52 11.1 14.57 13.15 15.47C13.65 15.67 14.03 15.8 14.33 15.9C14.78 16.03 15.18 16 15.48 15.95C15.83 15.88 16.53 15.48 16.73 14.93C16.93 14.38 16.93 13.93 16.88 13.83C16.83 13.73 16.68 13.68 16.48 13.58L16.95 14.32Z"/>
      </svg>
    </a>
  );
};

export default WhatsAppButton;