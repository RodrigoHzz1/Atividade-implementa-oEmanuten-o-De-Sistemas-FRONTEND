import React from 'react';
import './loading.css';

// Indicador visual de carregamento usado em telas que dependem de API.
export default function Loading() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );
}