import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewsletters } from '../../hooks/useNewslettersAndNews';
import ModernEmailBuilder, { type EmailTemplate } from './EmailBuilder/ModernEmailBuilder';
import './CreateNewsletterModern.css';

const CreateNewsletterModern: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createNewsletter, updateNewsletter } = useNewsletters();
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (template: EmailTemplate) => {
    setIsSaving(true);
    
    try {
      const newsletterData = {
        title: template.subject || 'Новая рассылка',
        subject: template.subject,
        preheader: template.preheader || '',
        emailBlocks: JSON.stringify(template.sections),
        content: '', // HTML будет генерироваться из sections
        targetAudience: 'all',
        segmentCriteria: {},
        status: 'draft'
      };

      if (id) {
        // Обновление существующей рассылки
        await updateNewsletter(id, newsletterData);
        alert('✅ Рассылка обновлена!');
      } else {
        // Создание новой рассылки
        const result = await createNewsletter(newsletterData);
        alert('✅ Рассылка создана!');
        navigate(`/admin/newsletters/edit/${result.id}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('❌ Ошибка при сохранении рассылки');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Отменить создание рассылки? Несохранённые изменения будут потеряны.')) {
      navigate('/admin/newsletters');
    }
  };

  return (
    <div className="create-newsletter-modern">
      <ModernEmailBuilder
        onSave={handleSave}
        onCancel={handleCancel}
      />
      
      {isSaving && (
        <div className="saving-overlay">
          <div className="spinner"></div>
          <p>Сохранение...</p>
        </div>
      )}
    </div>
  );
};

export default CreateNewsletterModern;
