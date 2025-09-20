import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

const Logo: React.FC = () => {
  return (
    <div className="logo-container">
      <Link to="/" className="logo-link">
        <img src="/icons/logo_wekey_tools.svg" alt="WeKey Tools" className="logo-svg" />
      </Link>
    </div>
  );
};

export default Logo;