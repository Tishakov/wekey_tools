import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { toolsService } from '../services/toolsService';
import type { Tool } from '../utils/toolsConfig';
import './Home.css';

const Home: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTools = async () => {
      try {
        const activeTools = await toolsService.getActiveTools();
        setTools(activeTools);
      } catch (error) {
        console.error('Ошибка загрузки инструментов:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  if (loading) {
    return (
      <div className="home">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#666'
        }}>
          Загрузка инструментов...
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="tools-grid">
        {tools.map((tool) => (
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
