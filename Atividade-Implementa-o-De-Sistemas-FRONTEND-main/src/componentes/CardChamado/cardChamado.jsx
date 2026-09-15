import React from 'react';
import StatusBadge from '../StatusBadge/statusBadge';
import './cardChamado.css';

// Cartão resumido de um chamado.
// Mostra identificador, status, título e data em um formato compacto para listagem.
export default function CardChamado({ chamado, onClick }) {
  // O backend manda "dataCriacao" (ChamadoResponseDto); "data" só existe em
  // alguns dados mockados antigos, por isso aceitamos os dois.
  const dataExibida = chamado.dataCriacao
    ? (String(chamado.dataCriacao).includes('T')
        ? new Date(chamado.dataCriacao).toLocaleDateString('pt-BR')
        : chamado.dataCriacao)
    : chamado.data;

  return (
    <div className="card-chamado" onClick={onClick}>
      <div className="card-header">
        <span className="card-id">#{chamado.id}</span>
        <StatusBadge status={chamado.status} />
      </div>
      <h3 className="card-title">{chamado.titulo}</h3>
      <p className="card-desc">{chamado.descricao}</p>
      <div className="card-footer">
        <span className="card-date">{dataExibida}</span>
        {/* A tag que exibia a prioridade foi removida daqui */}
      </div>
    </div>
  );
}