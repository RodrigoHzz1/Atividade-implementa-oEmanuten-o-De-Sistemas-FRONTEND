import React, { useState, useEffect } from 'react';
import Header from '../../componentes/Header/header';
import CardChamado from '../../componentes/CardChamado/cardChamado';
import Footer from '../../componentes/Footer/footer';
import { chamadoService } from '../../Services/chamadoService';
import './homeCliente.css';

// Portal do cliente.
// Exibe os chamados abertos por esse usuário e permite navegar para abertura ou detalhes.
export default function HomeCliente({ user, chamados = [], onLogout, onNavigate }) {
  const [meusChamados, setMeusChamados] = useState(chamados);
  const [loading, setLoading] = useState(!chamados.length);
  const [erro, setErro] = useState('');

  // Busca os chamados do cliente autenticado via API
  useEffect(() => {
    const carregarChamadosCliente = async () => {
      // Se já vieram chamados via props, evita nova busca
      if (chamados && chamados.length > 0) {
        setMeusChamados(chamados);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro('');

        // Endpoint real do backend: GET /chamados/usuario/{usuarioId}
        const clienteId = user?.id || user?.usuarioId;
        const dados = clienteId
          ? await chamadoService.listarPorUsuario(clienteId)
          : await chamadoService.listarTodos();

        setMeusChamados(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao carregar chamados do cliente:', err);
        setErro('Não foi possível carregar seus chamados no momento.');
      } finally {
        setLoading(false);
      }
    };

    carregarChamadosCliente();
  }, [user?.id, user?.usuarioId]);

  return (
    <div className="layout-container">
      <Header user={user} onLogout={onLogout} />
      
      <main className="client-content">
        <div className="client-hero">
          <div>
            <h1>Portal do Cliente</h1>
            <p>Gerencie seus chamados e acompanhe o atendimento em tempo real.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => onNavigate('novoChamado')}
          >
            + Abrir Novo Chamado
          </button>
        </div>

        {/* Mensagem de alerta de erro */}
        {erro && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {erro}
          </div>
        )}

        <section className="tickets-section">
          <h2>Seus Chamados Recentes</h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
              Carregando seus chamados...
            </div>
          ) : meusChamados.length > 0 ? (
            <div className="tickets-grid">
              {meusChamados.map((item) => (
                <CardChamado
                  key={item.id}
                  chamado={item}
                  onClick={() => onNavigate('detalhesChamado', item)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
              Nenhum chamado encontrado. Clique no botão acima para abrir uma nova solicitação.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}