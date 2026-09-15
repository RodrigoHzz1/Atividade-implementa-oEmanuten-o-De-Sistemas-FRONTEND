import React from 'react';
import './moduleCard.css';

// Card de módulo para a página inicial de funcionários.
// Agrupa funcionalidade e oferece acesso rápido para cada área do sistema.
export default function ModuleCard({ title, description, icon, onClick }) {
  return (
    <div className="module-card" onClick={onClick}>
      <div className="module-icon">{icon}</div>
      <h3 className="module-title">{title}</h3>
      <p className="module-desc">{description}</p>
    </div>
  );
}