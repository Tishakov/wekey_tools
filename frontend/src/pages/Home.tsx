import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import { toolsService } from '../services/toolsService';
import type { Tool } from '../utils/toolsConfig';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  // Функция для получения переведенного названия инструмента
  const getToolName = (toolId: string, fallbackTitle: string) => {
    const translationKey = `tools.names.${toolId}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : fallbackTitle;
  };

  // Функция для получения переведенного описания инструмента
  const getToolDescription = (toolId: string, fallbackDescription: string) => {
    const translationKey = `tools.descriptions.${toolId}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : fallbackDescription;
  };

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
  }, [t]); // Добавляем t в зависимости для обновления при смене языка

  // Сортируем инструменты по переведенным названиям (как в сайдбаре)
  const sortedTools = [...tools].sort((a, b) => {
    const nameA = getToolName(a.id, a.title);
    const nameB = getToolName(b.id, b.title);
    return nameA.localeCompare(nameB);
  });

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
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="tools-grid">
        {sortedTools.map((tool) => (
          <Card
            key={tool.id}
            title={getToolName(tool.id, tool.title)}
            description={getToolDescription(tool.id, tool.description)}
            icon={tool.icon}
            path={tool.path}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
