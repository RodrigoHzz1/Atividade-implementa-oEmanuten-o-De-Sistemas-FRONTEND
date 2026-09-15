import React from 'react';
import './footer.css';

// Rodapé padrão da interface.
// Mantém a identidade visual da aplicação em todas as telas.
export default function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; {new Date().getFullYear()} TechNexus. Todos os direitos reservados.</p>
    </footer>
  );
}