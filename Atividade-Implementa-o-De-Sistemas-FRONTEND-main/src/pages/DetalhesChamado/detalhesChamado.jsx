import React, { useState, useEffect, useRef } from 'react';
import Header from '../../componentes/Header/header';
import Footer from '../../componentes/Footer/footer';
import { atendimentoService } from '../../Services/atendimento';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './detalhesChamado.css';

// Tela detalhada do chamado.
// Reúne informações do ticket, histórico de atendimentos e comunicação em tempo real via WebSocket.
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const STATUS_OPCOES = ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO', 'RESOLVIDO', 'CANCELADO'];
const NIVEIS = ['N1', 'N2', 'N3'];

const STATUS_INFO = {
  ABERTO: { label: 'Aberto', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
  EM_ATENDIMENTO: { label: 'Em Atendimento', bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: 'rgba(234, 179, 8, 0.2)' },
  AGUARDANDO: { label: 'Aguardando', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
  RESOLVIDO: { label: 'Resolvido', bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
  CANCELADO: { label: 'Cancelado', bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' },
};

const extrairIdDeObjeto = (obj) => {
  if (!obj || typeof obj !== 'object') return null;

  const chavesId = [
    'id', 'usuarioId', 'idUsuario', 'userId', 'user_id',
    'id_usuario', 'codUsuario', 'codigo', 'sub', 'idUser', 'usuario_id'
  ];

  for (const chave of chavesId) {
    if (obj[chave] !== undefined && obj[chave] !== null && obj[chave] !== '') {
      const num = Number(obj[chave]);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  const subObjetos = [obj.user, obj.usuario, obj.dados, obj.data, obj.usuarioDTO, obj.cliente, obj.tecnico];
  for (const sub of subObjetos) {
    if (sub && typeof sub === 'object') {
      const subId = extrairIdDeObjeto(sub);
      if (subId) return subId;
    }
  }

  return null;
};

const obterUsuarioLogado = (userProp) => {
  if (userProp) {
    const idProp = extrairIdDeObjeto(userProp);
    if (idProp) return { ...userProp, id: idProp };
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const item = localStorage.getItem(key);
      if (!item) continue;

      if (item.startsWith('{') || item.startsWith('[')) {
        const parsed = JSON.parse(item);
        const idEncontrado = extrairIdDeObjeto(parsed);
        if (idEncontrado) return { ...(typeof parsed === 'object' ? parsed : {}), id: idEncontrado };
      }

      if (item.split('.').length === 3) {
        try {
          const payloadBase64 = item.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(payloadBase64));
          const idToken = extrairIdDeObjeto(payload);
          if (idToken) return { ...payload, id: idToken };
        } catch (e) {
          // ignora tokens que falharem na decodificação
        }
      }
    }
  } catch (e) {
    console.error('Erro ao ler localStorage:', e);
  }

  return userProp || null;
};

export default function DetalhesChamado({ chamado, onBack, user, onLogout }) {
  const [dados, setDados] = useState(chamado || null);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false);

  const usuarioAtual = obterUsuarioLogado(user);
  const idUsuarioLogado = usuarioAtual?.id ? Number(usuarioAtual.id) : null;

  const [formAtendimento, setFormAtendimento] = useState({
    tecnicoId: idUsuarioLogado || '',
    observacao: '',
    prioridade: dados?.prioridade || 'BAIXA',
    status: dados?.status || 'ABERTO',
    nivelSuporte: 'N1',
  });

  const [mensagemChat, setMensagemChat] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [excluindoAtendimentoId, setExcluindoAtendimentoId] = useState(null);

  const chatEndRef = useRef(null);

  const perfilUsuario = (usuarioAtual?.perfil || usuarioAtual?.tipo || user?.perfil || user?.tipo || '').toUpperCase();
  const isTecnicoOuAdmin = perfilUsuario !== 'CLIENTE' && perfilUsuario !== '';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (idUsuarioLogado && !formAtendimento.tecnicoId) {
      setFormAtendimento((prev) => ({ ...prev, tecnicoId: idUsuarioLogado }));
    }
  }, [idUsuarioLogado]);

  useEffect(() => {
    if (!dados?.id) return;

    const carregarHistorico = async (silencioso = false) => {
      try {
        if (!silencioso) setCarregandoHistorico(true);
        const lista = await atendimentoService.listarPorChamado(dados.id);

        setHistorico((prev) => {
          const novaLista = lista || [];
          if (JSON.stringify(prev) === JSON.stringify(novaLista)) return prev;
          return novaLista;
        });
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
      } finally {
        if (!silencioso) {
          setCarregandoHistorico(false);
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    carregarHistorico(false);

    const intervalId = setInterval(() => {
      carregarHistorico(true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [dados?.id]);

  useEffect(() => {
    if (!dados?.id) return;

    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
      reconnectDelay: 3000,
      onConnect: () => {
        stompClient.subscribe(`/topic/chamado/${dados.id}`, (message) => {
          if (message.body) {
            const novoAtendimento = JSON.parse(message.body);

            setHistorico((prev) => {
              const jaExiste = prev.some((item) => String(item.id) === String(novoAtendimento.id));
              if (jaExiste) return prev;
              return [...prev, novoAtendimento];
            });

            if (novoAtendimento.status || novoAtendimento.prioridade) {
              setDados((prevDados) => ({
                ...prevDados,
                status: novoAtendimento.status || prevDados.status,
                prioridade: novoAtendimento.prioridade || prevDados.prioridade,
              }));
            }

            setTimeout(scrollToBottom, 100);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Erro WebSocket:', frame.headers['message']);
      },
    });

    stompClient.activate();

    return () => {
      if (stompClient.active) stompClient.deactivate();
    };
  }, [dados?.id]);

  if (!dados) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#050812', color: '#fff' }}>
        <Header user={user} onLogout={onLogout} />
        <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          <p style={{ color: '#94a3b8' }}>Nenhum chamado selecionado.</p>
          <button onClick={onBack} style={{ marginTop: '1rem', backgroundColor: '#0b0f19', border: '1px solid #1e293b', color: '#94a3b8', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
            ← Voltar
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const statusInfo = STATUS_INFO[dados.status] || STATUS_INFO.ABERTO;
  const dataFormatada = dados.dataCriacao
    ? (String(dados.dataCriacao).includes('T') ? new Date(dados.dataCriacao).toLocaleString('pt-BR') : dados.dataCriacao)
    : (dados.data || 'Sem data');

  const handleRegistrarAtendimentoTecnico = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!idUsuarioLogado) {
      setErro('Sessão expirada ou ID do usuário não identificado. Faça login novamente.');
      return;
    }

    if (!formAtendimento.tecnicoId) {
      setErro('Informe o ID do técnico responsável.');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        chamadoId: Number(dados.id),
        tecnicoId: Number(formAtendimento.tecnicoId),
        usuarioId: idUsuarioLogado,
        observacao: formAtendimento.observacao.trim(),
        prioridade: formAtendimento.prioridade,
        status: formAtendimento.status,
        nivelSuporte: formAtendimento.nivelSuporte,
      };

      const atendimentoCriado = await atendimentoService.registrar(payload);

      setHistorico((prev) => {
        if (prev.some((a) => a.id === atendimentoCriado.id)) return prev;
        return [...prev, atendimentoCriado];
      });

      setDados((prev) => ({
        ...prev,
        status: formAtendimento.status,
        prioridade: formAtendimento.prioridade,
      }));

      setFormAtendimento((prev) => ({ ...prev, observacao: '' }));
      setMostrarFormAtendimento(false);
      setSucesso('Atendimento e status atualizados com sucesso!');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Erro ao registrar atendimento técnico:', err);
      setErro(err.response?.data?.mensagem || err.response?.data?.message || 'Não foi possível registrar o atendimento.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarMensagemChat = async (e) => {
    e.preventDefault();
    if (!mensagemChat.trim()) return;

    if (!idUsuarioLogado) {
      setErro('Sessão inválida: ID do usuário não encontrado. Faça login novamente.');
      return;
    }

    setErro('');
    setEnviando(true);

    try {
      const payload = {
        chamadoId: Number(dados.id),
        usuarioId: idUsuarioLogado,
        tecnicoId: isTecnicoOuAdmin ? idUsuarioLogado : (dados?.tecnicoId || null),
        observacao: mensagemChat.trim(),
        prioridade: dados?.prioridade || 'BAIXA',
        status: dados?.status || 'ABERTO',
        nivelSuporte: 'N1',
      };

      const respostaApi = await atendimentoService.registrar(payload);
      const atendimentoSalvo = respostaApi?.data || respostaApi;

      setHistorico((prev) => {
        if (prev.some((a) => a.id === atendimentoSalvo.id)) return prev;
        return [...prev, atendimentoSalvo];
      });

      setMensagemChat('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Erro ao enviar mensagem no chat:', err);
      setErro(err.response?.data?.mensagem || err.response?.data?.message || 'Não foi possível salvar a mensagem no servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluirAtendimento = async (atendimentoId) => {
    const confirmar = window.confirm('Excluir este atendimento do histórico?');
    if (!confirmar) return;

    setExcluindoAtendimentoId(atendimentoId);
    try {
      await atendimentoService.excluir(atendimentoId);
      setHistorico((prev) => prev.filter((a) => a.id !== atendimentoId));
    } catch (err) {
      console.error('Erro ao excluir atendimento:', err);
      alert(err.response?.data?.mensagem || 'Não foi possível excluir este atendimento.');
    } finally {
      setExcluindoAtendimentoId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#050812', color: '#fff' }}>
      <Header user={user} onLogout={onLogout} />

      <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '950px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px',
              padding: '0.6rem 1rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer'
            }}
          >
            ← Voltar
          </button>
        </div>

        {erro && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        {sucesso && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {sucesso}
          </div>
        )}

        {/* Card de Informações */}
        <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 20px 30px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Chamado #{dados.id}</span>
              <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', color: '#f8fafc' }}>{dados.titulo}</h1>
            </div>

            <span style={{
              backgroundColor: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
              padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
            }}>
              {statusInfo.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', backgroundColor: '#111827', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', margin: '1.5rem 0' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Solicitante</span>
              <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.nomeSolicitante || 'Não informado'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Aberto em</span>
              <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dataFormatada}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Prioridade</span>
              <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.prioridade || 'BAIXA'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Equipamento</span>
              <strong style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{dados.equipamento || 'Não informado'}</strong>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.5rem' }}>Descrição</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>{dados.descricao}</p>
          </div>

          {isTecnicoOuAdmin && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #1e293b', paddingTop: '1.5rem' }}>
              {!mostrarFormAtendimento ? (
                <button
                  onClick={() => setMostrarFormAtendimento(true)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ⚙️ Alterar Status / Registrar Atendimento Formal
                </button>
              ) : (
                <form onSubmit={handleRegistrarAtendimentoTecnico} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#111827', padding: '1.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <h3 style={{ fontSize: '1rem', color: '#f8fafc', margin: 0 }}>Atualizar Chamado e Nível de Suporte</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID do Técnico Responsável</label>
                    <input
                      type="number"
                      value={formAtendimento.tecnicoId}
                      onChange={(e) => setFormAtendimento({ ...formAtendimento, tecnicoId: e.target.value })}
                      required
                      style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Novo Status</label>
                      <select
                        value={formAtendimento.status}
                        onChange={(e) => setFormAtendimento({ ...formAtendimento, status: e.target.value })}
                        style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                      >
                        {STATUS_OPCOES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Prioridade</label>
                      <select
                        value={formAtendimento.prioridade}
                        onChange={(e) => setFormAtendimento({ ...formAtendimento, prioridade: e.target.value })}
                        style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                      >
                        {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nível de Suporte</label>
                      <select
                        value={formAtendimento.nivelSuporte}
                        onChange={(e) => setFormAtendimento({ ...formAtendimento, nivelSuporte: e.target.value })}
                        style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff' }}
                      >
                        {NIVEIS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Parecer Técnico / Observação</label>
                    <textarea
                      rows={3}
                      value={formAtendimento.observacao}
                      onChange={(e) => setFormAtendimento({ ...formAtendimento, observacao: e.target.value })}
                      required
                      style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#fff', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setMostrarFormAtendimento(false)} disabled={enviando}
                      style={{ backgroundColor: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={enviando}
                      style={{ backgroundColor: '#8b5cf6', border: 'none', color: '#fff', padding: '0.6rem 1.1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                      {enviando ? 'Salvando...' : 'Atualizar Chamado'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '480px', overflow: 'hidden' }}>
          
          <div style={{ padding: '1rem', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💭 Chat de Atendimento (Solicitante x Atendente)</span>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {carregandoHistorico && historico.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Carregando conversa...</p>
            ) : historico.length > 0 ? (
              historico.map((item, index) => {
                const idAutorMensagem = Number(item.usuarioId || item.idUsuario || item.usuario?.id);
                const ehMinhaMensagem = Boolean(idUsuarioLogado && idAutorMensagem && idUsuarioLogado === idAutorMensagem);

                const nomeRemetente = ehMinhaMensagem
                  ? 'Você'
                  : (item.usuarioNome || item.nomeUsuario || item.tecnicoNome || item.nomeTecnico || 'Atendente');

                const textoMensagem = item.observacao || item.mensagem || item.descricao || item.texto;

                return (
                  <div
                    key={item.id || index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: ehMinhaMensagem ? 'flex-end' : 'flex-start',
                      alignSelf: ehMinhaMensagem ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      width: 'fit-content'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {nomeRemetente} • {item.dataAtendimento || item.dataCriacao ? new Date(item.dataAtendimento || item.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                      </span>

                      {isTecnicoOuAdmin && item.id && (
                        <button
                          onClick={() => handleExcluirAtendimento(item.id)}
                          disabled={excluindoAtendimentoId === item.id}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', padding: 0, fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          excluir
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        backgroundColor: ehMinhaMensagem ? '#8b5cf6' : '#1e293b',
                        color: '#fff',
                        padding: '0.75rem 1rem',
                        borderRadius: ehMinhaMensagem ? '12px 12px 0px 12px' : '12px 12px 12px 0px',
                        wordBreak: 'break-word',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                    >
                      {textoMensagem || '(Mensagem vazia)'}
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                Nenhuma mensagem no chat ainda. Digite abaixo para interagir.
              </p>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleEnviarMensagemChat} style={{ padding: '0.75rem', borderTop: '1px solid #1e293b', display: 'flex', gap: '0.5rem', backgroundColor: '#0f172a' }}>
            <input
              type="text"
              placeholder="Escreva sua mensagem..."
              value={mensagemChat}
              onChange={(e) => setMensagemChat(e.target.value)}
              disabled={enviando}
              style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#fff', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={enviando || !mensagemChat.trim()}
              style={{ backgroundColor: '#8b5cf6', border: 'none', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: enviando || !mensagemChat.trim() ? 0.6 : 1 }}
            >
              {enviando ? '...' : 'Enviar'}
            </button>
          </form>
        </div>

      </main>

      <Footer />
    </div>
  );
}