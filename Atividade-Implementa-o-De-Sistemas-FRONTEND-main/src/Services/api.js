import axios from 'axios';

// Instância central de comunicação HTTP com o backend.
// Utiliza a variável de ambiente se configurada na Vercel, ou cai de fallback no link do Railway.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://atividade-implementao-de-sistemas-backend-production-3dee.up.railway.app',
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
