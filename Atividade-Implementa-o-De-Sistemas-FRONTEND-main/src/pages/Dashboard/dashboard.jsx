import React, { useState, useEffect } from 'react';
import Header from '../../componentes/Header/header';
import { chamadoService } from '../../Services/chamadoService';
import './dashboard.css';

// Dashboard operacional para visualizar métricas e indicadores do sistema.
// Calcula contagens de chamados por status para dar visão geral rápida ao time.
export default function Dashboard({ user, onLogout, onBack }) {
  const [metrics, setMetrics] = useState({
    chamadosAbertos: 0,
    emAndamento: 0,
    resolvidosHoje: 0,
    tempoMedioSla: '--',
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErro('');

        // Busca a lista completa de chamados para calcular as métricas em tempo real
        const chamados = await chamadoService.listarTodos();

        if (Array.isArray(chamados)) {
          // Valores alinhados ao enum real StatusChamado do backend:
          // ABERTO, EM_ATENDIMENTO, ARGURDANDO, RESOLVIDO, CANCELADO
          const abertos = chamados.filter((c) => c.status === 'ABERTO').length;

          const emAndamento = chamados.filter(
            (c) => c.status === 'EM_ATENDIMENTO' || c.status === 'ARGURDANDO'
          ).length;

          const resolvidos = chamados.filter((c) => c.status === 'RESOLVIDO').length;

          setMetrics({
            chamadosAbertos: abertos,
            emAndamento: emAndamento,
            resolvidosHoje: resolvidos,
            tempoMedioSla: '1h 45m', // Mantido como valor referencial do SLA
          });
        }
      } catch (error) {
        console.error('Erro ao carregar métricas do dashboard:', error);
        setErro('Não foi possível carregar as métricas do sistema.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header com os botões funcionais de navegação e logout */}
      <Header user={user} onLogout={onLogout} showBack={true} onBack={onBack} />

      <main className="dashboard-content">
        {/* Navegação Manual no topo */}
        <div className="top-navigation">
          <button className="btn-back" onClick={onBack}>
            ← Voltar ao Início
          </button>
        </div>

        <header className="page-header">
          <h1>Dashboard Operacional</h1>
          <p>Métricas gerais do sistema e tempo médio de resposta.</p>
        </header>

        {erro && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {erro}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Carregando métricas...</div>
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-title">Chamados Abertos</span>
              <span className="kpi-value text-red">{metrics.chamadosAbertos}</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Em Andamento</span>
              <span className="kpi-value text-yellow">{metrics.emAndamento}</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Resolvidos / Concluídos</span>
              <span className="kpi-value text-green">{metrics.resolvidosHoje}</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-title">Tempo Médio SLA</span>
              <span className="kpi-value">{metrics.tempoMedioSla}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}