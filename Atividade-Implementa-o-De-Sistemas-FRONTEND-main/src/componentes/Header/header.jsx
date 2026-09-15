import React from 'react';
import { useAuth, PERFIL_LABELS } from '../../Context/AuthContext';
import Logo from '../Logo/logo';
import './header.css';

// Cabeçalho global da aplicação.
// Exibe a marca da empresa, o nome do usuário autenticado e o botão de logout.
const Header = () => {
  const { user, logout } = useAuth();

  // Garante a exibição do nome do usuário ou fallback
  const nomeExibicao = user?.nome || user?.email?.split('@')[0] || 'Usuário';

  // Obtém a legenda amigável do cargo ou usa o próprio campo perfil/cargo
  const cargoExibicao = PERFIL_LABELS[user?.perfil] || user?.cargo || 'Cliente';

  return (
    <header className="app-header">
      <div className="header-left">
        <Logo size="small" />
      </div>

      {user && (
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{nomeExibicao}</span>
            <span className="user-role">{cargoExibicao}</span>
          </div>
          <button className="logout-btn" onClick={logout}>
            Sair
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;