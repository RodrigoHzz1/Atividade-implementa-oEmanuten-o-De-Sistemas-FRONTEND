import React from 'react';
import AppRoutes from './routes/appRoutes';

// Componente principal da aplicação.
// Ele funciona como ponto de entrada do sistema e delega a renderização
// da interface para o arquivo de rotas, que decide entre login, cliente
// e áreas internas do funcionário.
export default function App() {
  return <AppRoutes />;
}