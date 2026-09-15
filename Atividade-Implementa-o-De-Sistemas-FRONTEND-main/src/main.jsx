import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './Context/AuthContext';
import './index.css';

// Ponto de montagem do React.
// O AuthProvider envolve toda a aplicação para que o contexto de autenticação
// fique disponível em qualquer tela, sem precisar passar props manualmente.
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
}