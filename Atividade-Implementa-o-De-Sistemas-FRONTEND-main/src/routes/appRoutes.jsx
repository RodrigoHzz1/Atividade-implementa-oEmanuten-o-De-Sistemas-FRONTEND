import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';

// Importação das páginas da aplicação.
// Cada tela representa uma funcionalidade principal do sistema e é acessada
// de acordo com o perfil autenticado e a página atual em estado local.
import Login from '../pages/Login/login';
import HomeFuncionario from '../pages/Home/homeFuncionario';
import HomeCliente from '../pages/Home/homeCliente';
import Dashboard from '../pages/Dashboard/dashboard';
import Chamados from '../pages/Chamados/chamados';
import NovoChamado from '../pages/NovoChamado/novoChamado';
import DetalhesChamado from '../pages/DetalhesChamado/detalhesChamado';
import Funcionarios from '../pages/Funcionarios/funcionarios';
import Relatorio from '../pages/Relatorio/relatorio';
import Admin from '../pages/Admin/admin';

// Componente central de navegação.
// Ele controla a tela ativa com useState e redireciona para a página certa
// com base no perfil do usuário autenticado.
export default function AppRoutes() {
  const { user, logout } = useAuth();

  const [currentPage, setCurrentPage] = useState('home');
  const [selectedChamado, setSelectedChamado] = useState(null);

  // Encapsula o logout e reinicia a navegação para a página inicial.
  const handleLogout = () => {
    logout();
    setCurrentPage('home');
    setSelectedChamado(null);
  };

  // Navegação entre telas e passagem de parâmetros opcionais.
  const handleNavigate = (page, params = {}) => {
    const chamado = params?.chamado || (params?.id ? params : null);
    if (chamado) {
      setSelectedChamado(chamado);
    }
    setCurrentPage(page);
  };

  // Volta para a página principal do módulo atual da área interna.
  const handleBack = () => {
    setCurrentPage('home');
  };

  // Se não houver usuário autenticado, exibe a página de Login.
  if (!user) {
    return <Login />;
  }

  // Prioriza o perfil real retornado pelo backend (user.perfil).
  const perfilUsuario = (user.perfil || user.cargo || user.tipo || '').toUpperCase();
  const isCliente = perfilUsuario.includes('CLIENTE');

  // Fluxo exclusivo para clientes: acesso ao portal do usuário final.
  if (isCliente) {
    if (currentPage === 'novoChamado') {
      return (
        <NovoChamado
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
          onAddChamado={handleBack}
        />
      );
    }
    if (currentPage === 'detalhesChamado') {
      return (
        <DetalhesChamado
          user={user}
          chamado={selectedChamado}
          onLogout={handleLogout}
          onBack={handleBack}
        />
      );
    }
    return (
      <HomeCliente
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
      />
    );
  }

  // Fluxo para funcionários, técnicos e administradores.
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {currentPage === 'home' && (
        <HomeFuncionario
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'dashboard' && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
        />
      )}
      {currentPage === 'chamados' && (
        <Chamados
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'detalhesChamado' && (
        <DetalhesChamado
          user={user}
          chamado={selectedChamado}
          onLogout={handleLogout}
          onBack={() => setCurrentPage('chamados')}
        />
      )}
      {currentPage === 'novoChamado' && (
        <NovoChamado
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
          onAddChamado={handleBack}
        />
      )}
      {currentPage === 'funcionarios' && (perfilUsuario.includes('ADMIN') || perfilUsuario.includes('TECNICO')) && (
        <Funcionarios
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
        />
      )}
      {currentPage === 'admin' && perfilUsuario.includes('ADMIN') && (
        <Admin
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'relatorio' && (
        <Relatorio
          user={user}
          onLogout={handleLogout}
          onBack={handleBack}
        />
      )}
    </div>
  );
}