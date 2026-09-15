import React from 'react';

export default function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', color: '#f87171', textAlign: 'center' }}>
        Acesso restrito. Faça login para continuar.
      </div>
    );
  }

  return children;
}