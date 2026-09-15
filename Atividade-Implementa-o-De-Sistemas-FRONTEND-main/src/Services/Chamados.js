import api from './api';

// Serviço de integração com os endpoints de chamados do backend.
// Centraliza operações CRUD e evita duplicação de lógica em cada página.
export const chamadoService = {
  criar: async (dadosChamado) => {
    const response = await api.post('/chamados', dadosChamado);
    return response.data;
  },

  listarTodos: async () => {
    const response = await api.get('/chamados');
    return response.data;
  },

  listarPorUsuario: async (usuarioId) => {
    const response = await api.get(`/chamados/usuario/${usuarioId}`);
    return response.data;
  },

  excluir: async (id) => {
    const response = await api.delete(`/chamados/${id}`);
    return response.data;
  },

  // PUT /chamados/{id} — edição direta pelo admin (título, descrição,
  // equipamento, prioridade, status)
  atualizar: async (id, dados) => {
    const response = await api.put(`/chamados/${id}`, dados);
    return response.data?.dados;
  }
};

export default chamadoService;