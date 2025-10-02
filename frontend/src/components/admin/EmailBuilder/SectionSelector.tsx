import React from 'react';
import type { SectionLayout } from './types';
import './SectionSelector.css';

interface SectionSelectorProps {
  onSelect: (layout: SectionLayout) => void;
  onClose: () => void;
}

interface SectionTemplate {
  layout: SectionLayout;
  name: string;
  description: string;
  icon: string;
}

const sectionTemplates: SectionTemplate[] = [
  {
    layout: '1col',
    name: 'Одна колонка',
    description: 'Полная ширина',
    icon: '▬',
  },
  {
    layout: '2col-50-50',
    name: 'Две колонки',
    description: '50% / 50%',
    icon: '▬▬',
  },
  {
    layout: '2col-33-66',
    name: 'Две колонки',
    description: '33% / 67%',
    icon: '▬▬▬',
  },
  {
    layout: '2col-66-33',
    name: 'Две колонки',
    description: '67% / 33%',
    icon: '▬▬▬',
  },
  {
    layout: '3col',
    name: 'Три колонки',
    description: '33% / 33% / 33%',
    icon: '▬▬▬',
  },
  {
    layout: '4col',
    name: 'Четыре колонки',
    description: '25% каждая',
    icon: '▬▬▬▬',
  },
];

const SectionSelector: React.FC<SectionSelectorProps> = ({ onSelect, onClose }) => {
  return (
    <div className="section-selector-overlay" onClick={onClose}>
      <div className="section-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="section-selector-header">
          <h3>Выберите тип секции</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="section-selector-content">
          {sectionTemplates.map((template) => (
            <div
              key={template.layout}
              className="section-card"
              onClick={() => onSelect(template.layout)}
            >
              <div className="section-preview">
                <SectionPreview layout={template.layout} />
              </div>
              <div className="section-info">
                <div className="section-name">{template.name}</div>
                <div className="section-description">{template.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="section-selector-footer">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент превью секции
const SectionPreview: React.FC<{ layout: SectionLayout }> = ({ layout }) => {
  const renderColumns = () => {
    switch (layout) {
      case '1col':
        return <div className="preview-column full" />;
        
      case '2col-50-50':
        return (
          <>
            <div className="preview-column half" />
            <div className="preview-column half" />
          </>
        );
        
      case '2col-33-66':
        return (
          <>
            <div className="preview-column third" />
            <div className="preview-column two-thirds" />
          </>
        );
        
      case '2col-66-33':
        return (
          <>
            <div className="preview-column two-thirds" />
            <div className="preview-column third" />
          </>
        );
        
      case '3col':
        return (
          <>
            <div className="preview-column third" />
            <div className="preview-column third" />
            <div className="preview-column third" />
          </>
        );
        
      case '4col':
        return (
          <>
            <div className="preview-column quarter" />
            <div className="preview-column quarter" />
            <div className="preview-column quarter" />
            <div className="preview-column quarter" />
          </>
        );
        
      default:
        return <div className="preview-column full" />;
    }
  };
  
  return <div className="section-preview-columns">{renderColumns()}</div>;
};

export default SectionSelector;
