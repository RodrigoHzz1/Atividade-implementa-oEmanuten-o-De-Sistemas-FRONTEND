import React from 'react';
import './statusBadge.css';

// Badge visual para representar o estado do chamado.
// Mapeia os valores retornados pelo backend para classes de cor e texto.
export default function StatusBadge({ status }) {
  // Classes alinhadas ao enum real StatusChamado do backend:
  // ABERTO, EM_ATENDIMENTO, ARGURDANDO, RESOLVIDO, CANCELADO
  const getStatusClass = () => {
    switch (status?.toUpperCase()) {
      case 'ABERTO': return 'badge-open';
      case 'EM_ATENDIMENTO':
      case 'ARGURDANDO': return 'badge-progress';
      case 'RESOLVIDO': return 'badge-closed';
      case 'CANCELADO': return 'badge-cancelled';
      default: return 'badge-default';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {status}
    </span>
  );
}