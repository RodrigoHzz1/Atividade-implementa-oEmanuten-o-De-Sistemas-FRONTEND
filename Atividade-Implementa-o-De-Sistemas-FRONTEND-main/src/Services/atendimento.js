import api from './api';

// Serviço responsável por registrar e consultar atendimentos.
// Também trata a estrutura do payload retornado pela API, que vem encapsulado
// em um objeto com campo "dados".
export const atendimentoService = {
  // IMPORTANTE: o AtendimentoController embrulha tudo em RespostaApiDto
  // ({ mensagem, dados }). Sem desembrulhar aqui, o restante do app recebia
  // esse objeto no lugar do atendimento/array esperado (causa do bug
  // "prev is not iterable" ao registrar atendimento).
  registrar: async (dadosAtendimento) => {
    const response = await api.post('/atendimentos', dadosAtendimento);
    return response.data?.dados;
  },

  listarTodos: async () => {
    const response = await api.get('/atendimentos');
    return response.data?.dados || [];
  },

  listarPorChamado: async (chamadoId) => {
    const response = await api.get(`/atendimentos/chamado/${chamadoId}`);
    return response.data?.dados || [];
  },

  excluir: async (id) => {
    const response = await api.delete(`/atendimentos/${id}`);
    return response.data;
  },

  // PUT /atendimentos/{id} — edição direta pelo admin (observação,
  // prioridade, status, nível de suporte)
  atualizar: async (id, dados) => {
    const response = await api.put(`/atendimentos/${id}`, dados);
    return response.data?.dados;
  }
};

export default atendimentoService;