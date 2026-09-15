import React, { useState, useEffect, useRef } from 'react';
import Header from '../../componentes/Header/header';
import { chamadoService } from '../../Services/chamadoService';
import { atendimentoService } from '../../Services/atendimento';
import './admin.css';

// Painel administrativo.
// Permite revisar todos os chamados/atendimentos e executar ações de edição e exclusão em um único lugar.
const STATUS_LABELS = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  ARGURDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  CANCELADO: 'Cancelado',
};
const STATUS_OPCOES = ['ABERTO', 'EM_ATENDIMENTO', 'ARGURDANDO', 'RESOLVIDO', 'CANCELADO'];
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const NIVEIS = ['N1', 'N2', 'N3'];

const inputStyle = {
  backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '6px',
  padding: '0.4rem 0.6rem', color: '#fff', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box'
};

// Painel do Administrador: reúne, em um só lugar, tudo que a API do backend
// realmente expõe de forma agregada — GET /chamados e GET /atendimentos —
// e permite editar/excluir diretamente por aqui.
// OBS: não existe GET /usuarios (listar todos os usuários) no backend, então
// esta tela não mostra uma tabela de "todos os usuários do sistema"; isso
// fica na tela de Colaboradores (acessível a partir daqui).
export default function Admin({ user, onLogout, onBack, onNavigate }) {
  const [chamados, setChamados] = useState([]);
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [excluindoChamadoId, setExcluindoChamadoId] = useState(null);
  const [excluindoAtendimentoId, setExcluindoAtendimentoId] = useState(null);

  const [editandoChamadoId, setEditandoChamadoId] = useState(null);
  const [formChamado, setFormChamado] = useState({});
  const [salvandoChamado, setSalvandoChamado] = useState(false);

  const [editandoAtendimentoId, setEditandoAtendimentoId] = useState(null);
  const [formAtendimento, setFormAtendimento] = useState({});
  const [salvandoAtendimento, setSalvandoAtendimento] = useState(false);

  const jaCarregou = useRef(false);

  useEffect(() => {
    if (jaCarregou.current) return;
    jaCarregou.current = true;
    carregarTudo();
  }, []);

  const carregarTudo = async () => {
    try {
      setLoading(true);
      setErro('');
      const [chamadosRes, atendimentosRes] = await Promise.allSettled([
        chamadoService.listarTodos(),
        atendimentoService.listarTodos(),
      ]);

      setChamados(chamadosRes.status === 'fulfilled' ? chamadosRes.value || [] : []);
      setAtendimentos(atendimentosRes.status === 'fulfilled' ? atendimentosRes.value || [] : []);

      if (chamadosRes.status === 'rejected' && atendimentosRes.status === 'rejected') {
        setErro('Não foi possível carregar os dados do sistema.');
      }
    } catch (err) {
      console.error('Erro ao carregar painel administrativo:', err);
      setErro('Não foi possível carregar os dados do sistema.');
    } finally {
      setLoading(false);
    }
  };

  const contagemPorStatus = chamados.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  // ---------- CHAMADOS: excluir e editar ----------

  const handleExcluirChamado = async (chamado, event) => {
    event.stopPropagation();
    const confirmar = window.confirm(
      `Excluir o chamado #${chamado.id} ("${chamado.titulo}")? Isso também remove o histórico de atendimentos dele. Essa ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    setExcluindoChamadoId(chamado.id);
    try {
      await chamadoService.excluir(chamado.id);
      setChamados((prev) => prev.filter((c) => c.id !== chamado.id));
      setAtendimentos((prev) => prev.filter((a) => a.chamadoId !== chamado.id));
    } catch (err) {
      console.error('Erro ao excluir chamado:', err);
      alert(err.response?.data?.mensagem || 'Não foi possível excluir este chamado.');
    } finally {
      setExcluindoChamadoId(null);
    }
  };

  const iniciarEdicaoChamado = (chamado, event) => {
    event.stopPropagation();
    setEditandoChamadoId(chamado.id);
    setFormChamado({
      titulo: chamado.titulo || '',
      descricao: chamado.descricao || '',
      equipamento: chamado.equipamento || '',
      prioridade: chamado.prioridade || 'BAIXA',
      status: chamado.status || 'ABERTO',
    });
  };

  const cancelarEdicaoChamado = (event) => {
    event.stopPropagation();
    setEditandoChamadoId(null);
  };

  // PUT /chamados/{id}
  const salvarEdicaoChamado = async (id, event) => {
    event.stopPropagation();
    setSalvandoChamado(true);
    try {
      const atualizado = await chamadoService.atualizar(id, formChamado);
      setChamados((prev) => prev.map((c) => (c.id === id ? { ...c, ...atualizado } : c)));
      setEditandoChamadoId(null);
    } catch (err) {
      console.error('Erro ao editar chamado:', err);
      alert(err.response?.data?.mensagem || 'Não foi possível salvar as alterações do chamado.');
    } finally {
      setSalvandoChamado(false);
    }
  };

  // ---------- ATENDIMENTOS: excluir e editar ----------

  const handleExcluirAtendimento = async (id, event) => {
    event.stopPropagation();
    const confirmar = window.confirm(
      'Excluir este atendimento do histórico? Essa ação não pode ser desfeita.'
    );
    if (!confirmar) return;

    setExcluindoAtendimentoId(id);
    try {
      await atendimentoService.excluir(id);
      setAtendimentos((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Erro ao excluir atendimento:', err);
      alert(err.response?.data?.mensagem || 'Não foi possível excluir este atendimento.');
    } finally {
      setExcluindoAtendimentoId(null);
    }
  };

  const iniciarEdicaoAtendimento = (atendimento, event) => {
    event.stopPropagation();
    setEditandoAtendimentoId(atendimento.id);
    setFormAtendimento({
      observacao: atendimento.observacao || '',
      prioridade: atendimento.prioridade || 'BAIXA',
      status: atendimento.status || 'ABERTO',
      nivelSuporte: atendimento.nivelSuporte || 'N1',
    });
  };

  const cancelarEdicaoAtendimento = (event) => {
    event.stopPropagation();
    setEditandoAtendimentoId(null);
  };

  // PUT /atendimentos/{id}
  const salvarEdicaoAtendimento = async (id, event) => {
    event.stopPropagation();
    setSalvandoAtendimento(true);
    try {
      const atualizado = await atendimentoService.atualizar(id, formAtendimento);
      setAtendimentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...atualizado } : a)));
      setEditandoAtendimentoId(null);
    } catch (err) {
      console.error('Erro ao editar atendimento:', err);
      alert(err.response?.data?.mensagem || 'Não foi possível salvar as alterações do atendimento.');
    } finally {
      setSalvandoAtendimento(false);
    }
  };

  return (
    <div className="tn-admin-container">
      <Header user={user} onLogout={onLogout} />

      <main className="tn-admin-main">
        <div className="tn-admin-topbar">
          <button className="tn-btn-ghost" onClick={onBack}>← Voltar para o Início</button>
        </div>

        <header className="tn-admin-header">
          <h1>Painel do Administrador</h1>
          <p>Visão geral de todos os chamados e atendimentos registrados no sistema — com edição e exclusão diretas.</p>
        </header>

        {erro && <div className="tn-admin-alert">{erro}</div>}

        {/* KPIs agregados (GET /chamados) */}
        <section className="tn-admin-kpis">
          <div className="tn-admin-kpi">
            <span>Total de Chamados</span>
            <strong>{loading ? '...' : chamados.length}</strong>
          </div>
          <div className="tn-admin-kpi">
            <span>Abertos</span>
            <strong className="cor-azul">{loading ? '...' : (contagemPorStatus.ABERTO || 0)}</strong>
          </div>
          <div className="tn-admin-kpi">
            <span>Em Atendimento</span>
            <strong className="cor-amarelo">{loading ? '...' : (contagemPorStatus.EM_ATENDIMENTO || 0)}</strong>
          </div>
          <div className="tn-admin-kpi">
            <span>Resolvidos</span>
            <strong className="cor-verde">{loading ? '...' : (contagemPorStatus.RESOLVIDO || 0)}</strong>
          </div>
          <div className="tn-admin-kpi">
            <span>Cancelados</span>
            <strong className="cor-cinza">{loading ? '...' : (contagemPorStatus.CANCELADO || 0)}</strong>
          </div>
          <div className="tn-admin-kpi">
            <span>Atendimentos Registrados</span>
            <strong>{loading ? '...' : atendimentos.length}</strong>
          </div>
        </section>

        {/* Acesso rápido à gestão de usuários */}
        <section className="tn-admin-quicklink">
          <div>
            <h2>Colaboradores</h2>
            <p>Cadastrar, editar, alterar perfil e excluir colaboradores.</p>
          </div>
          <button className="tn-btn-primary" onClick={() => onNavigate('funcionarios')}>
            Gerenciar Colaboradores
          </button>
        </section>

        {/* Todos os chamados */}
        <section className="tn-admin-section">
          <h2>Todos os Chamados</h2>
          {loading ? (
            <p className="tn-admin-loading">Carregando chamados...</p>
          ) : chamados.length > 0 ? (
            <div className="tn-admin-table-wrapper">
              <table className="tn-admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Solicitante</th>
                    <th>Equipamento</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Aberto em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {chamados.map((c) => (
                    editandoChamadoId === c.id ? (
                      <tr key={c.id} style={{ background: '#111827' }}>
                        <td>#{c.id}</td>
                        <td colSpan={2}>
                          <input style={inputStyle} value={formChamado.titulo}
                            onChange={(e) => setFormChamado({ ...formChamado, titulo: e.target.value })} placeholder="Título" />
                          <textarea style={{ ...inputStyle, marginTop: '0.35rem', resize: 'vertical' }} rows={2} value={formChamado.descricao}
                            onChange={(e) => setFormChamado({ ...formChamado, descricao: e.target.value })} placeholder="Descrição" />
                        </td>
                        <td>
                          <input style={inputStyle} value={formChamado.equipamento}
                            onChange={(e) => setFormChamado({ ...formChamado, equipamento: e.target.value })} placeholder="Equipamento" />
                        </td>
                        <td>
                          <select style={inputStyle} value={formChamado.prioridade}
                            onChange={(e) => setFormChamado({ ...formChamado, prioridade: e.target.value })}>
                            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td>
                          <select style={inputStyle} value={formChamado.status}
                            onChange={(e) => setFormChamado({ ...formChamado, status: e.target.value })}>
                            {STATUS_OPCOES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>{c.dataCriacao ? new Date(c.dataCriacao).toLocaleString('pt-BR') : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={(e) => salvarEdicaoChamado(c.id, e)} disabled={salvandoChamado}
                              style={{ background: '#8b5cf6', border: 'none', color: '#fff', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                              {salvandoChamado ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button onClick={cancelarEdicaoChamado}
                              style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={c.id} onClick={() => onNavigate('detalhesChamado', c)} className="tn-admin-row-clicavel">
                        <td>#{c.id}</td>
                        <td>{c.titulo}</td>
                        <td>{c.nomeSolicitante || '—'}</td>
                        <td>{c.equipamento || '—'}</td>
                        <td>{c.prioridade || 'BAIXA'}</td>
                        <td>
                          <span className={`tn-admin-badge status-${(c.status || 'ABERTO').toLowerCase()}`}>
                            {STATUS_LABELS[c.status] || c.status || 'Aberto'}
                          </span>
                        </td>
                        <td>{c.dataCriacao ? new Date(c.dataCriacao).toLocaleString('pt-BR') : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={(e) => iniciarEdicaoChamado(c, e)}
                              style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={(e) => handleExcluirChamado(c, e)}
                              disabled={excluindoChamadoId === c.id}
                              style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {excluindoChamadoId === c.id ? 'Excluindo...' : 'Excluir'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="tn-admin-empty">Nenhum chamado encontrado.</p>
          )}
        </section>

        {/* Todos os atendimentos */}
        <section className="tn-admin-section">
          <h2>Todos os Atendimentos</h2>
          {loading ? (
            <p className="tn-admin-loading">Carregando atendimentos...</p>
          ) : atendimentos.length > 0 ? (
            <div className="tn-admin-table-wrapper">
              <table className="tn-admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Chamado</th>
                    <th>Técnico</th>
                    <th>Nível</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Observação</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentos.map((a, idx) => (
                    editandoAtendimentoId === a.id ? (
                      <tr key={a.id || idx} style={{ background: '#111827' }}>
                        <td>#{a.id}</td>
                        <td>#{a.chamadoId}</td>
                        <td>{a.nomeTecnico || a.tecnicoId || '—'}</td>
                        <td>
                          <select style={inputStyle} value={formAtendimento.nivelSuporte}
                            onChange={(e) => setFormAtendimento({ ...formAtendimento, nivelSuporte: e.target.value })}>
                            {NIVEIS.map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td>
                          <select style={inputStyle} value={formAtendimento.prioridade}
                            onChange={(e) => setFormAtendimento({ ...formAtendimento, prioridade: e.target.value })}>
                            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td>
                          <select style={inputStyle} value={formAtendimento.status}
                            onChange={(e) => setFormAtendimento({ ...formAtendimento, status: e.target.value })}>
                            {STATUS_OPCOES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={formAtendimento.observacao}
                            onChange={(e) => setFormAtendimento({ ...formAtendimento, observacao: e.target.value })} />
                        </td>
                        <td>{a.dataAtendimento ? new Date(a.dataAtendimento).toLocaleString('pt-BR') : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={(e) => salvarEdicaoAtendimento(a.id, e)} disabled={salvandoAtendimento}
                              style={{ background: '#8b5cf6', border: 'none', color: '#fff', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                              {salvandoAtendimento ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button onClick={cancelarEdicaoAtendimento}
                              style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={a.id || idx}>
                        <td>#{a.id}</td>
                        <td>#{a.chamadoId}</td>
                        <td>{a.nomeTecnico || a.tecnicoId || '—'}</td>
                        <td>{a.nivelSuporte || '—'}</td>
                        <td>{a.prioridade || '—'}</td>
                        <td>
                          <span className={`tn-admin-badge status-${(a.status || 'ABERTO').toLowerCase()}`}>
                            {STATUS_LABELS[a.status] || a.status || '—'}
                          </span>
                        </td>
                        <td className="tn-admin-obs">{a.observacao || '—'}</td>
                        <td>{a.dataAtendimento ? new Date(a.dataAtendimento).toLocaleString('pt-BR') : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={(e) => iniciarEdicaoAtendimento(a, e)}
                              style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={(e) => handleExcluirAtendimento(a.id, e)}
                              disabled={excluindoAtendimentoId === a.id}
                              style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {excluindoAtendimentoId === a.id ? 'Excluindo...' : 'Excluir'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="tn-admin-empty">Nenhum atendimento registrado.</p>
          )}
        </section>
      </main>
    </div>
  );
}
