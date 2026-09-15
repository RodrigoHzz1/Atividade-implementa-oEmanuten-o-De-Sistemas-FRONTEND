import React from 'react';
import './sidebar.css';

// Barra lateral do painel interno.
// Recebe uma lista de itens e destaca o item ativo de acordo com a navegação.
export default function Sidebar({ items = [], activeItem, onItemClick }) {
  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => onItemClick(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}