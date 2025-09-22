import React from 'react';
import { Link } from 'react-router-dom';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import './Logo.css';

const Logo: React.FC = () => {
  const { createLink } = useLocalizedLink();
  
  return (
    <div className="logo-container">
      <Link to={createLink('')} className="logo-link">
        <img src="/icons/logo_wekey_tools.svg" alt="WeKey Tools" className="logo-svg" />
      </Link>
    </div>
  );
};

export default Logo;