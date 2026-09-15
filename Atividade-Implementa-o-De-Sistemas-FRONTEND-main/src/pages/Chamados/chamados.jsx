import React, { useState, useEffect } from 'react';
import Header from '../../componentes/Header/header';
import Footer from '../../componentes/Footer/footer';
import { chamadoService } from '../../Services/chamadoService';

// Tela de listagem de chamados.
// Mostra o histórico do sistema e permite abrir detalhes ou excluir itens com permissão administrativa.
const STATUS_INFO = {
  ABERTO: { label: 'Aberto', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
  EM_ATENDIMENTO: { label: 'Em Atendimento', bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: 'rgba(234, 179, 8, 0.2)' },
  ARGURDANDO: { label: 'Aguardando', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
  RESOLVIDO: { label: 'Resolvido', bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
  CANCELADO: { label: 'Cancelado', bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
};

const getStatusInfo = (status) => STATUS_INFO[status] || STATUS_INFO.ABERTO;

export default function Chamados({ user, onLogout, onNavigate, onBack }) {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [excluindoId, setExcluindoId] = useState(null);

  // Apenas Administradores podem excluir ou alterar chamados estruturalmente
  const isAdmin = (user?.perfil || user?.tipo || '').toUpperCase() === 'ADMIN';

  const carregarChamados = async () => {
    try {
      setLoading(true);
      setErro('');
      const dados = await chamadoService.listarTodos();
      const formatados = (dados || []).map((item) => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        equipamento: item.equipamento,
        status: item.status || 'ABERTO',
        prioridade: item.prioridade || 'BAIXA',
        data: item.dataCriacao ? new Date(item.dataCriacao).toLocaleString('pt-BR') : 'Sem data',
        nomeSolicitante: item.nomeSolicitante || 'Não identificado',
      }));

      setChamados(formatados);
    } catch (err) {
      console.error('Erro ao buscar chamados:', err);
      setErro('Não foi possível carregar a lista de chamados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarChamados();
  }, []);

  const handleVoltar = () => {
    if (typeof onBack === 'function') onBack();
    else if (typeof onNavigate === 'function') onNavigate('home');
  };

  const handleAbrirDetalhes = (chamado) => {
    if (typeof onNavigate === 'function') {
      onNavigate('detalhesChamado', chamado);
    }
  };

  const handleExcluir = async (chamado, event) => {
    event.stopPropagation();
    if (!isAdmin) return;

    const confirmar = window.confirm(`Excluir o chamado #${chamado.id} ("${chamado.titulo}")? Essa ação não pode ser desfeita.`);
    if (!confirmar) return;

    setExcluindoId(chamado.id);
    try {
      await chamadoService.excluir(chamado.id);
      setChamados((prev) => prev.filter((c) => c.id !== chamado.id));
    } catch (err) {
      console.error('Erro ao excluir chamado:', err);
      alert(err.response?.data?.mensagem || 'Não foi possível excluir este chamado.');
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#050812', color: '#fff' }}>
      <Header user={user} onLogout={onLogout} />

      <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '1000px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button type="button" onClick={handleVoltar} style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 1rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            ← Voltar
          </button>
        </div>

        {erro && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{erro}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>Carregando chamados...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {chamados.length > 0 ? (
              chamados.map((dados) => {
                const statusInfo = getStatusInfo(dados.status);
                return (
                  <div key={dados.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Chamado #{dados.id}</span>
                        <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', color: '#f8fafc' }}>{dados.titulo}</h2>
                      </div>
                      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
                        {statusInfo.label.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#111827', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', margin: '1.25rem 0' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Solicitante</span>
                        <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.nomeSolicitante}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Aberto em</span>
                        <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.data}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Prioridade</span>
                        <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.prioridade}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Equipamento</span>
                        <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.equipamento || 'Não informado'}</strong>
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '0.5rem' }}>Descrição</h3>
                      <p style={{ color: '#94a3b8', lineHeight: '1.5', margin: 0, fontSize: '0.95rem' }}>{dados.descricao}</p>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      {isAdmin && (
                        <button
                          onClick={(e) => handleExcluir(dados, e)}
                          disabled={excluindoId === dados.id}
                          style={{ backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {excluindoId === dados.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      )}
                      <button
                        onClick={() => handleAbrirDetalhes(dados)}
                        style={{ backgroundColor: '#8b5cf6', border: 'none', color: '#fff', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Abrir Chat / Detalhes
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', backgroundColor: '#0b0f19', borderRadius: '12px', border: '1px solid #1e293b' }}>
                Nenhum chamado encontrado.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}