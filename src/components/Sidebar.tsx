import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toolsConfig } from '../utils/toolsConfig';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  // Сортируем инструменты по алфавиту
  const sortedTools = [...toolsConfig].sort((a, b) => a.title.localeCompare(b.title));
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {sortedTools.map((tool) => (
            <li key={tool.id} className="sidebar-menu-item">
              <Link 
                to={tool.path} 
                className={`sidebar-link ${location.pathname === tool.path ? 'active' : ''}`}
              >
                {tool.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;