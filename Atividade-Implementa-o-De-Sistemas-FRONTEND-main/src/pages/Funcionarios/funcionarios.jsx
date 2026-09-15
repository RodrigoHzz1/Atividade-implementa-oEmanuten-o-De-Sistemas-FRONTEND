import React, { useState, useEffect, useRef } from 'react';
import Header from '../../componentes/Header/header';
import { funcionarioService } from '../../Services/funcionarioService';
import { PERFIL_LABELS } from '../../Context/AuthContext';
import './funcionarios.css';

// Gestão de colaboradores e perfis.
// Permite cadastro, edição, troca de perfil e exclusão de usuários do sistema.
const PERFIS = ['CLIENTE', 'FUNCIONARIO', 'TECNICO_N1', 'TECNICO_N2', 'TECNICO_N3', 'ADMIN'];

export default function Funcionarios({ user, onLogout, onBack }) {
  // Verifica se o usuário logado possui permissão de Administrador
  const isAdmin = (user?.perfil || '').toUpperCase() === 'ADMIN';

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erroLista, setErroLista] = useState('');

  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', perfil: 'TECNICO_N1' });
  const [cadastrando, setCadastrando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');

  const [idAlterar, setIdAlterar] = useState('');
  const [nomeAlterar, setNomeAlterar] = useState('');
  const [emailAlterar, setEmailAlterar] = useState('');
  const [perfilAlterar, setPerfilAlterar] = useState('TECNICO_N1');
  const [alterando, setAlterando] = useState(false);
  const [erroAlterar, setErroAlterar] = useState('');
  const [sucessoAlterar, setSucessoAlterar] = useState('');

  const [excluindoId, setExcluindoId] = useState(null);
  const jaCarregou = useRef(false);

  // GET /usuarios — busca lista de colaboradores
  const carregarColaboradores = async () => {
    try {
      setLoading(true);
      setErroLista('');
      const lista = await funcionarioService.listarTodos();
      setColaboradores(lista || []);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
      setErroLista('Não foi possível carregar a lista de colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jaCarregou.current) return;
    jaCarregou.current = true;
    carregarColaboradores();
  }, []);

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setErroCadastro('');
    setCadastrando(true);
    try {
      await funcionarioService.cadastrar(novo);
      setNovo({ nome: '', email: '', senha: '', perfil: 'TECNICO_N1' });
      await carregarColaboradores();
    } catch (err) {
      console.error('Erro ao cadastrar colaborador:', err);
      setErroCadastro(
        err.response?.data?.mensagem || 'Não foi possível cadastrar o colaborador.'
      );
    } finally {
      setCadastrando(false);
    }
  };

  const handleAlterarPerfil = async (e) => {
    e.preventDefault();
    setErroAlterar('');
    setSucessoAlterar('');
    if (!idAlterar) return;

    setAlterando(true);
    try {
      if (nomeAlterar.trim() || emailAlterar.trim()) {
        await funcionarioService.atualizar(idAlterar, {
          nome: nomeAlterar.trim() || undefined,
          email: emailAlterar.trim() || undefined,
        });
      }
      await funcionarioService.alterarPerfil(idAlterar, perfilAlterar);

      setSucessoAlterar(`Colaborador #${idAlterar} atualizado com sucesso.`);
      await carregarColaboradores();
    } catch (err) {
      console.error('Erro ao editar colaborador:', err);
      setErroAlterar(
        err.response?.data?.mensagem || 'Não foi possível atualizar o colaborador no backend.'
      );
    } finally {
      setAlterando(false);
    }
  };

  const handleExcluir = async (colaborador) => {
    const confirmar = window.confirm(
      `Excluir o colaborador "${colaborador.nome}" (#${colaborador.id})?\n\n` +
      `Isso também vai excluir os chamados abertos por ele e o histórico de atendimentos ligados a esses chamados.\n` +
      `Essa ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    setExcluindoId(colaborador.id);
    try {
      await funcionarioService.excluir(colaborador.id);
      setColaboradores((prev) => prev.filter((c) => c.id !== colaborador.id));
    } catch (err) {
      console.error('Erro ao excluir colaborador:', err);
      alert(
        err.response?.data?.mensagem ||
        'Não foi possível excluir este colaborador.'
      );
    } finally {
      setExcluindoId(null);
    }
  };

  const preencherAlteracao = (colaborador) => {
    setIdAlterar(String(colaborador.id));
    setNomeAlterar(colaborador.nome || '');
    setEmailAlterar(colaborador.email || '');
    setPerfilAlterar(colaborador.perfil || 'TECNICO_N1');
    setErroAlterar('');
    setSucessoAlterar('');
  };

  return (
    <div className="tn-app-container">
      <Header user={user} onLogout={onLogout} />

      <main className="tn-main-layout">
        <div className="tn-top-bar">
          <button className="tn-btn-ghost" onClick={onBack}>
            ← Voltar para o Início
          </button>
        </div>

        <header className="tn-header-section">
          <div>
            <h1 className="tn-heading-lg">Gestão de Colaboradores</h1>
            <p className="tn-text-subtle">
              {isAdmin
                ? 'Cadastre colaboradores e ajuste níveis de acesso/suporte.'
                : 'Visualização da equipe de colaboradores cadastrados.'}
            </p>
          </div>
        </header>

        {/* Seção de Cadastro e Edição visível SOMENTE para Administradores */}
        {isAdmin && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Cadastro */}
            <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Novo Colaborador</h2>
              {erroCadastro && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {erroCadastro}
                </div>
              )}
              <form onSubmit={handleCadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <input
                  type="text" placeholder="Nome" required
                  value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                />
                <input
                  type="email" placeholder="E-mail" required
                  value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                />
                <input
                  type="password" placeholder="Senha (mín. 4 caracteres)" required minLength={4} maxLength={20}
                  value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                />
                <select
                  value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value })}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                >
                  {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="submit" disabled={cadastrando}
                  style={{ backgroundColor: '#8b5cf6', border: 'none', color: '#fff', padding: '0.65rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  {cadastrando ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </form>
            </div>

            {/* Edição */}
            <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Editar Colaborador</h2>
              {erroAlterar && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {erroAlterar}
                </div>
              )}
              {sucessoAlterar && (
                <div style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {sucessoAlterar}
                </div>
              )}
              <form onSubmit={handleAlterarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <input
                  type="number" placeholder="ID do usuário" required
                  value={idAlterar} onChange={(e) => setIdAlterar(e.target.value)}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                />
                <input
                  type="text" placeholder="Novo nome (opcional)"
                  value={nomeAlterar} onChange={(e) => setNomeAlterar(e.target.value)}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                />
                <input
                  type="email" placeholder="Novo e-mail (opcional)"
                  value={emailAlterar} onChange={(e) => setEmailAlterar(e.target.value)}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                />
                <select
                  value={perfilAlterar} onChange={(e) => setPerfilAlterar(e.target.value)}
                  style={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                >
                  {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="submit" disabled={alterando}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.65rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  {alterando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Tabela de Colaboradores */}
        <section className="tn-table-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Todos os Colaboradores</h2>
            <button
              onClick={carregarColaboradores}
              disabled={loading}
              style={{ backgroundColor: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {loading ? 'Atualizando...' : '↻ Atualizar'}
            </button>
          </div>

          {erroLista && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {erroLista}
            </div>
          )}

          <table className="tn-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>COLABORADOR</th>
                <th>PERFIL</th>
                {isAdmin && <th>AÇÕES</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="tn-empty-row">Carregando colaboradores...</td>
                </tr>
              ) : colaboradores.length > 0 ? (
                colaboradores.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <div className="tn-user-info">
                        <span className="tn-user-name">{item.nome}</span>
                        <span className="tn-user-email">{item.email}</span>
                      </div>
                    </td>
                    <td>{PERFIL_LABELS[item.perfil] || item.perfil}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => preencherAlteracao(item)}
                            style={{ backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleExcluir(item)}
                            disabled={excluindoId === item.id}
                            style={{ backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            {excluindoId === item.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="tn-empty-row">
                    Nenhum colaborador cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}