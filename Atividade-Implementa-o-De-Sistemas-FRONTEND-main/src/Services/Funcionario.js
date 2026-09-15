import api from './api';

// Serviço para manipulação de usuários/colaboradores.
// O frontend usa esses métodos para gerenciar cadastro, alteração de perfil e exclusão.
export const funcionarioService = {
  cadastrar: async (dadosUsuario) => {
    const response = await api.post('/usuarios', dadosUsuario);
    return response.data;
  },

  // GET /usuarios — lista real de todos os usuários cadastrados.
  listarTodos: async () => {
    const response = await api.get('/usuarios');
    return response.data?.dados || [];
  },

  alterarPerfil: async (id, perfil) => {
    const response = await api.patch(`/usuarios/${id}/perfil`, null, {
      params: { perfil }
    });
    return response.data;
  },

  excluir: async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  // PUT /usuarios/{id} — edita nome/e-mail (e senha, se enviada).
  atualizar: async (id, dados) => {
    const response = await api.put(`/usuarios/${id}`, dados);
    return response.data?.dados;
  }
};

export default funcionarioService;