import React from 'react';
import Card from '../components/Card';
import { toolsConfig } from '../utils/toolsConfig';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="tools-grid">
        {toolsConfig.map((tool) => (
          <Card
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            path={tool.path}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
