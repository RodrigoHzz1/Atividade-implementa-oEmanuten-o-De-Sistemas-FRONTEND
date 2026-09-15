import React, { useState } from 'react';
import Header from '../../componentes/Header/header';
import Footer from '../../componentes/Footer/footer';
import { chamadoService } from '../../Services/chamadoService';

// Formulário para abertura de um novo chamado pelo cliente.
// Envia apenas os campos aceitos pela API: título, descrição e equipamento.
export default function NovoChamado({ onBack, onAddChamado }) {
  const [titulo, setTitulo] = useState('');
  const [equipamento, setEquipamento] = useState('');
  const [descricao, setDescricao] = useState('');

  // Estados para integração com API
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Mapeamento exato do ChamadoRequestDto do backend: apenas titulo,
    // descricao e equipamento são aceitos na criação. Prioridade e status
    // não entram aqui — eles só são definidos quando um técnico registra
    // um atendimento (POST /atendimentos) sobre o chamado.
    const payload = {
      titulo,
      descricao,
      equipamento: equipamento.trim() || null,
    };

    try {
      // Chamada HTTP POST para o ChamadoController (/chamados)
      const novoChamadoCriado = await chamadoService.criar(payload);

      if (onAddChamado) {
        onAddChamado(novoChamadoCriado);
      }

      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Erro ao registrar chamado:', err);
      setErro(
        err.response?.data?.mensagem ||
        'Não foi possível registrar a solicitação. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#050812', color: '#fff' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '720px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Botão Quadrado no Canto Superior */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={onBack}
            disabled={carregando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#0b0f19',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              color: '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: carregando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Voltar
          </button>
        </div>

        {/* Card Principal do Form */}
        <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', boxShadow: '0 20px 30px rgba(0, 0, 0, 0.5)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
            Abrir Solicitação de Suporte
          </h2>

          {/* Mensagem de Erro da API */}
          {erro && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>Assunto / Título</label>
              <input
                type="text"
                placeholder="Ex: Falha na impressora do setor fiscal"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                disabled={carregando}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>Equipamento (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Notebook Dell, Impressora fiscal, VPN..."
                value={equipamento}
                onChange={(e) => setEquipamento(e.target.value)}
                disabled={carregando}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>Descrição do Problema</label>
              <textarea
                rows={6}
                placeholder="Relate aqui, com o máximo de detalhes possível, qual é o problema. É a partir dessa descrição que o técnico responsável vai entender e priorizar o atendimento..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                disabled={carregando}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={onBack}
                disabled={carregando}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #1e293b',
                  color: '#94a3b8',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: carregando ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={carregando}
                style={{
                  backgroundColor: carregando ? '#6d28d9' : '#8b5cf6',
                  border: 'none',
                  color: '#fff',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: carregando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                }}
              >
                {carregando ? 'Enviando...' : 'Enviar Chamado'}
              </button>
            </div>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}