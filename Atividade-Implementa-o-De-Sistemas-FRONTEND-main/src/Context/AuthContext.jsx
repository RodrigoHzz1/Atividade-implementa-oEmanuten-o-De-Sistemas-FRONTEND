import React, { createContext, useContext, useEffect, useState } from 'react';

// Helpers para ler o token e o usuário salvos em localStorage ou sessionStorage.
const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const getStoredUser = () => localStorage.getItem('user') || sessionStorage.getItem('user');

// Mapeamento dos perfis do sistema para rótulos amigáveis exibidos na interface.
export const PERFIL_LABELS = {
  CLIENTE: 'Cliente',
  FUNCIONARIO: 'Funcionário',
  TECNICO_N1: 'Técnico de Suporte Nível 1',
  TECNICO_N2: 'Técnico de Suporte Nível 2',
  TECNICO_N3: 'Técnico de Suporte Nível 3',
  ADMIN: 'Administrador',
};

// Armazena um diretório local de usuários conhecidos para melhorar a experiência
// de login quando a API não retorna todos os dados esperados.
const CHAVE_DIRETORIO = 'technexus_diretorio_usuarios';

const lerDiretorio = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_DIRETORIO) || '{}');
  } catch {
    return {};
  }
};

export const salvarUsuarioConhecido = (email, nome, perfil) => {
  const diretorio = lerDiretorio();
  diretorio[email.toLowerCase()] = { nome, perfil };
  localStorage.setItem(CHAVE_DIRETORIO, JSON.stringify(diretorio));
};

const buscarUsuarioConhecido = (email) => lerDiretorio()[email.toLowerCase()];

const AuthContext = createContext({});

// Provider que centraliza a autenticação do app.
// Ele mantém o usuario atual, controla o estado de carregamento e expõe
// funções para login e logout para toda a árvore de componentes.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarSessaoArmazenada = () => {
      try {
        const tokenSalvo = getStoredToken();
        const userSalvo = getStoredUser();

        if (tokenSalvo && userSalvo) {
          setUser(JSON.parse(userSalvo));
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    carregarSessaoArmazenada();
  }, []);

  // Realiza autenticação na API e salva o usuário em sessão/localStorage.
  const login = async (email, senha, lembrarMe = false, tipoAcessoSelecionado = 'funcionario') => {
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.mensagem || 'Falha na autenticação. Verifique e-mail e senha.');
      }

      const { id, token, perfil: perfilApi, email: emailApi, nome: nomeApi } = data?.dados || {};

      const conhecido = buscarUsuarioConhecido(email);
      const perfilReal = (
        perfilApi ||
        conhecido?.perfil ||
        (tipoAcessoSelecionado === 'cliente' ? 'CLIENTE' : 'TECNICO_N1')
      ).toUpperCase();

      const ehCliente = perfilReal.includes('CLIENTE');
      const tipoCorreto = ehCliente ? 'cliente' : 'funcionario';

      // Gera um nome legível a partir do e-mail quando a API não retorna nome.
      const nomeEmail = (emailApi || email).split('@')[0].replace(/[._-]/g, ' ');
      const nomeFormatado = nomeEmail.charAt(0).toUpperCase() + nomeEmail.slice(1);

      const userData = {
        id,
        email: emailApi || email,
        nome: nomeApi || conhecido?.nome || nomeFormatado,
        cargo: PERFIL_LABELS[perfilReal] || (ehCliente ? 'Cliente' : 'Técnico de Suporte'),
        tipo: tipoCorreto,
        perfil: perfilReal,
        token,
      };

      const storage = lembrarMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no login:', error);
      const mensagem = error.message || 'Falha na autenticação. Verifique e-mail e senha.';
      return { success: false, error: mensagem };
    }
  };

  // Remove as credenciais do usuário das áreas de armazenamento do navegador.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para consumir o contexto de autenticação.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

// Componente guarda de rota para permitir acesso somente a perfis específicos.
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { signed, user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          fontFamily: 'sans-serif',
        }}
      >
        <h2>Carregando sessão...</h2>
      </div>
    );
  }

  if (!signed) {
    window.location.href = '/login';
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.perfil || user?.role;
    if (!allowedRoles.includes(userRole)) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <h2>Acesso Negado</h2>
          <p>Você não possui permissão para acessar esta página.</p>
        </div>
      );
    }
  }

  return children;
};