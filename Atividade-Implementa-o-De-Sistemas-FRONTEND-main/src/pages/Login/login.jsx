import React, { useState } from 'react';
import Logo from '../../componentes/Logo/logo';
import { useAuth, salvarUsuarioConhecido } from '../../Context/AuthContext';
import { funcionarioService } from '../../Services/funcionarioService';
import './login.css';

// Tela de autenticação do sistema.
// Permite acesso ao cliente ou ao portal interno e também o cadastro inicial de usuários.
export default function Login() {
  const { login } = useAuth();
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro'
  const [tipoAcesso, setTipoAcesso] = useState('funcionario');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);

  // Estados para integração com API
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Estados exclusivos do cadastro (POST /usuarios)
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');
  const [sucessoCadastro, setSucessoCadastro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Chama o AuthContext, que faz o POST /auth/login e guarda a sessão.
    // Depois que setUser roda dentro do contexto, o AppRoutes re-renderiza
    // sozinho — não é preciso nenhum callback de sucesso aqui.
    const resultado = await login(email, senha, lembrar, tipoAcesso);

    if (!resultado.success) {
      setErro(resultado.error);
    }

    setCarregando(false);
  };

  // Cadastro de novo usuário: POST /usuarios (UsuarioController). O perfil é
  // definido pelo portal escolhido — autocadastro fica limitado a
  // CLIENTE ou TECNICO_N1; perfis mais altos (N2/N3/ADMIN) só são
  // atribuídos depois, internamente, pela tela de Colaboradores.
  const handleCadastro = async (e) => {
    e.preventDefault();
    setErroCadastro('');
    setSucessoCadastro('');
    setCadastrando(true);

    const perfil = tipoAcesso === 'cliente' ? 'CLIENTE' : 'TECNICO_N1';

    try {
      await funcionarioService.cadastrar({
        nome: nomeCadastro,
        email: emailCadastro,
        senha: senhaCadastro,
        perfil,
      });

      salvarUsuarioConhecido(emailCadastro, nomeCadastro, perfil);

      setSucessoCadastro('Conta criada com sucesso! Faça login para continuar.');
      setEmail(emailCadastro);
      setSenha('');
      setNomeCadastro('');
      setEmailCadastro('');
      setSenhaCadastro('');
      setModo('login');
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      setErroCadastro(
        err.response?.data?.mensagem || 'Não foi possível criar a conta. Tente novamente.'
      );
    } finally {
      setCadastrando(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Coluna Esquerda: Hero / Branding */}
      <div className="login-hero">
        <div className="hero-content">
          <div className="hero-brand">
            <Logo variant="full" />
          </div>

          <div className="hero-text">
            <h1>
              Gestão Integrada <br />
              <span className="purple-gradient-text">de Chamados</span>
            </h1>
            <p>
              Conecte atendimentos, equipamentos e sua equipe na plataforma centralizada TechNexus.
            </p>
          </div>

          {/* Área de Destaques do Sistema */}
          <div className="hero-features-card">
            <div className="feature-item">
              <div className="feature-badge">⚡</div>
              <div>
                <strong>Atendimento Inteligente</strong>
                <p>Priorização automática por SLA e impacto no negócio.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-badge">🛡️</div>
              <div>
                <strong>Segurança Avançada</strong>
                <p>Controle de acesso restrito e histórico de ações auditável.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-badge">📊</div>
              <div>
                <strong>Métricas em Tempo Real</strong>
                <p>Acompanhe o desempenho da infraestrutura em um único lugar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Acesso */}
      <div className="login-form-container">
        <div className="form-card">
          <div className="form-header">
            <h2>{modo === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h2>
            <p>
              {modo === 'login'
                ? 'Informe suas credenciais para entrar no TechNexus'
                : 'Preencha seus dados para começar a usar o TechNexus'}
            </p>
          </div>

          {/* Mensagem de Erro da API (login) */}
          {modo === 'login' && erro && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              {erro}
            </div>
          )}

          {/* Mensagem de sucesso do cadastro, exibida já na tela de login */}
          {modo === 'login' && sucessoCadastro && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              {sucessoCadastro}
            </div>
          )}

          {/* Abas de seleção de portal */}
         <div className="portal-selector">
  <button
    type="button"
    className={`portal-btn ${tipoAcesso === 'funcionario' ? 'active' : ''}`}
    onClick={() => setTipoAcesso('funcionario')}
  >
    Portal Administrador/Técnicos
  </button>
  <button
    type="button"
    className={`portal-btn ${tipoAcesso === 'cliente' ? 'active' : ''}`}
    onClick={() => setTipoAcesso('cliente')}
  >
    Portal Clientes/Colaboradores
  </button>
        </div>
          {modo === 'login' ? (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="email">
                    E-mail {tipoAcesso === 'funcionario' ? 'corporativo' : 'do cliente'}
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder={
                      tipoAcesso === 'funcionario'
                        ? 'usuario@technexus.com'
                        : 'cliente@empresa.com'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={carregando}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="senha">Senha</label>
                  <input
                    id="senha"
                    type="password"
                    placeholder="••••••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    disabled={carregando}
                  />
                </div>

                <div className="form-options">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={lembrar}
                      onChange={(e) => setLembrar(e.target.checked)}
                      disabled={carregando}
                    />
                    <span className="label-text">Lembrar acesso</span>
                  </label>
                  <a href="#esqueceu" className="forgot-link">
                    Esqueceu a senha?
                  </a>
                </div>

                <button type="submit" className="submit-btn" disabled={carregando}>
                  {carregando ? 'Autenticando...' : 'Entrar no Sistema'}
                </button>
              </form>

              <p className="switch-mode-text">
                Não tem conta?{' '}
                <button type="button" className="switch-mode-link" onClick={() => setModo('cadastro')}>
                  Cadastre-se
                </button>
              </p>
            </>
          ) : (
            <>
              {erroCadastro && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                  }}
                >
                  {erroCadastro}
                </div>
              )}

              <form onSubmit={handleCadastro} className="auth-form">
                <div className="input-group">
                  <label htmlFor="nomeCadastro">Nome completo</label>
                  <input
                    id="nomeCadastro"
                    type="text"
                    placeholder="Seu nome completo"
                    value={nomeCadastro}
                    onChange={(e) => setNomeCadastro(e.target.value)}
                    required
                    disabled={cadastrando}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emailCadastro">
                    E-mail {tipoAcesso === 'funcionario' ? 'corporativo' : 'do cliente'}
                  </label>
                  <input
                    id="emailCadastro"
                    type="email"
                    placeholder={
                      tipoAcesso === 'funcionario'
                        ? 'usuario@technexus.com'
                        : 'cliente@empresa.com'
                    }
                    value={emailCadastro}
                    onChange={(e) => setEmailCadastro(e.target.value)}
                    required
                    disabled={cadastrando}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="senhaCadastro">Senha</label>
                  <input
                    id="senhaCadastro"
                    type="password"
                    placeholder="Mínimo de 4 caracteres"
                    value={senhaCadastro}
                    onChange={(e) => setSenhaCadastro(e.target.value)}
                    required
                    minLength={4}
                    maxLength={20}
                    disabled={cadastrando}
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={cadastrando}>
                  {cadastrando ? 'Criando conta...' : 'Criar Conta'}
                </button>
              </form>

              <p className="switch-mode-text">
                Já tem conta?{' '}
                <button type="button" className="switch-mode-link" onClick={() => setModo('login')}>
                  Fazer login
                </button>
              </p>
            </>
          )}

          <footer className="login-footer">
            © 2026 TechNexus • Todos os direitos reservados
          </footer>
        </div>
      </div>
    </div>
  );
}