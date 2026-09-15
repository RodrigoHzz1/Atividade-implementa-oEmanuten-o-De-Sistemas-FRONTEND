import axios from 'axios';

// Instância central de comunicação HTTP com o backend.
// Todas as chamadas do frontend passam por aqui para padronizar a URL base,
// cabeçalhos e tratamento de autorização.
const api = axios.create({
  baseURL: 'http://127.0.0.1:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona automaticamente o token JWT em todas as requisições autenticadas.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Se a API responder 401/403, limpa a sessão do usuário para evitar acesso
// com credenciais expostas ou inválidas.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;