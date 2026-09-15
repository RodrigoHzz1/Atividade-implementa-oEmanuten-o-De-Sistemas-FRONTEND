import React from 'react';
import logoImg from '../../assets/logo.png';
import './logo.css';

// Componente visual da marca TechNexus.
// Aceita variações para usar em header ou em apresentações maiores.
export default function Logo({ variant = 'full' }) {
  return (
    <div className="technexus-logo">
      <img src={logoImg} alt="TechNexus Logo" className="logo-image" />
      {variant === 'full' && (
        <div className="logo-text-group">
          <span className="brand-name">TechNexus</span>
          <span className="brand-tagline">TECNOLOGIA QUE CONECTA VOCÊ</span>
        </div>
      )}
    </div>
  );
}