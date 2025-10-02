import React, { useEffect, useRef } from 'react';
import './IsolatedPreview.css';

interface IsolatedPreviewProps {
  html: string;
  className?: string;
}

/**
 * Компонент для изолированного отображения HTML контента
 * Использует iframe для предотвращения влияния стилей на основную страницу
 */
const IsolatedPreview: React.FC<IsolatedPreviewProps> = ({ html, className = '' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Создаем полный HTML документ для iframe
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Базовые стили для email */
            body {
              margin: 0;
              padding: 0;
              font-family: 'Google Sans', Arial, sans-serif;
              background: #ffffff;
              color: #333333;
              line-height: 1.6;
            }
            
            /* Обнуляем стили по умолчанию */
            * {
              box-sizing: border-box;
            }
            
            /* Стили для ссылок */
            a {
              color: #007cba;
              text-decoration: underline;
            }
            
            a:hover {
              color: #005a8b;
            }
            
            /* Стили для таблиц */
            table {
              border-collapse: collapse;
            }
            
            /* Отключаем pointer events для интерактивных элементов в превью */
            a, button, input, textarea, select {
              pointer-events: none;
              cursor: default;
            }
          </style>
        </head>
        <body>
          ${html || '<p style="padding: 20px; color: #999;">Содержание письма появится здесь...</p>'}
        </body>
      </html>
    `;

    // Записываем HTML в iframe
    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    // Динамически подстраиваем высоту iframe под контент
    const resizeIframe = () => {
      if (iframe && iframeDoc.body) {
        // Небольшая задержка для рендеринга контента
        setTimeout(() => {
          const contentHeight = iframeDoc.body.scrollHeight;
          iframe.style.height = `${contentHeight + 20}px`; // +20px для запаса
        }, 100);
      }
    };

    // Следим за изменениями размера контента
    resizeIframe();
    
    // MutationObserver для отслеживания изменений в контенте
    const observer = new MutationObserver(resizeIframe);
    observer.observe(iframeDoc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    // Также отслеживаем изменения размера окна
    window.addEventListener('resize', resizeIframe);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeIframe);
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className={`isolated-preview ${className}`}
      title="Email Preview"
      sandbox="allow-same-origin"
      // Начальная высота
      style={{ height: '400px' }}
    />
  );
};

export default IsolatedPreview;
