import React from 'react';
import { Link } from 'react-router-dom';
import './Card.css';

interface CardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
}

const Card: React.FC<CardProps> = ({ title, icon, path }) => {
  const isEmojiIcon = !icon.includes('.svg');
  
  return (
    <Link to={path} className="card">
      <div className="card-icon">
        {isEmojiIcon ? (
          icon
        ) : (
          <img src={icon} alt={title} className="card-icon-svg" />
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
      </div>
    </Link>
  );
};

export default Card;
