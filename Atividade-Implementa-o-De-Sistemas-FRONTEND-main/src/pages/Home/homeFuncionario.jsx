import React, { useState, useEffect } from 'react';
import Header from '../../componentes/Header/header';
import Sidebar from '../../componentes/Sidebar/sidebar';
import ModuleCard from '../../componentes/ModuleCard/moduleCard';
import Footer from '../../componentes/Footer/footer';
import { chamadoService } from '../../Services/chamadoService';
import './homeFuncionario.css';

// Página principal do ambiente interno.
// Centraliza módulos de atendimento, colaboradores e relatórios com base no perfil do usuário.
export default function HomeFuncionario({ user, onLogout, onNavigate }) {
  const isAdmin = (user?.perfil || '').toUpperCase() === 'ADMIN';

  const [resumo, setResumo] = useState({
    chamadosAbertos: 0,
    chamadosEmAtendimento: 0,
  });
  const [loading, setLoading] = useState(true);

  // Exibe a opção Colaboradores apenas se for ADMIN
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'chamados', label: 'Chamados', icon: '🎫' },
    ...(isAdmin ? [{ id: 'funcionarios', label: 'Colaboradores', icon: '👥' }] : []),
    { id: 'relatorio', label: 'Relatórios', icon: '📈' },
    ...(isAdmin ? [{ id: 'admin', label: 'Painel Admin', icon: '🛠️' }] : []),
  ];

  useEffect(() => {
    const carregarResumo = async () => {
      try {
        setLoading(true);
        const chamados = await chamadoService.listarTodos();

        setResumo({
          chamadosAbertos: (chamados || []).filter((c) => c.status === 'ABERTO').length,
          chamadosEmAtendimento: (chamados || []).filter((c) => c.status === 'EM_ATENDIMENTO').length,
        });
      } catch (err) {
        console.error('Erro ao carregar resumo:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarResumo();
  }, []);

  return (
    <div className="layout-container">
      <Header user={user} onLogout={onLogout} />

      <div className="layout-body">
        <Sidebar
          items={menuItems}
          activeItem="dashboard"
          onItemClick={(id) => onNavigate(id)}
        />

        <main className="main-content">
          <section className="welcome-section">
            <h1>Painel do Funcionário</h1>
            <p>
              Bem-vindo de volta, <strong>{user?.nome || 'Usuário'}</strong>. Selecione um módulo para iniciar.
            </p>
          </section>

          {!loading && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Chamados Abertos</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', color: '#38bdf8' }}>{resumo.chamadosAbertos}</h3>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Em Atendimento</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', color: '#eab308' }}>{resumo.chamadosEmAtendimento}</h3>
              </div>
            </div>
          )}

          <div className="modules-grid">
            <ModuleCard
              title="Gestão de Chamados"
              description="Visualizar, atender e registrar o andamento de chamados internos."
              icon="🎫"
              onClick={() => onNavigate('chamados')}
            />

            {/* Apenas exibe o Card de Colaboradores se o usuário for ADMIN */}
            {isAdmin && (
              <ModuleCard
                title="Colaboradores"
                description="Cadastrar novos colaboradores e ajustar níveis de acesso/suporte."
                icon="👥"
                onClick={() => onNavigate('funcionarios')}
              />
            )}

            <ModuleCard
              title="Relatórios Operacionais"
              description="Métricas de atendimento e desempenho da equipe."
              icon="📈"
              onClick={() => onNavigate('relatorio')}
            />

            {isAdmin && (
              <ModuleCard
                title="Painel Administrativo"
                description="Visão geral de todos os chamados e atendimentos do sistema."
                icon="🛠️"
                onClick={() => onNavigate('admin')}
              />
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}