import React, { useState } from 'react';

interface EmojiImageProps {
  emoji: string;
  className?: string;
  size?: number;
}

// Компонент для отображения Apple-style emoji с изображениями
export const AppleEmojiImage: React.FC<EmojiImageProps> = ({ emoji, className = '', size = 24 }) => {
  const [useImage, setUseImage] = useState(true);
  
  // Получаем Unicode код для Apple emoji
  const getAppleEmojiUrl = (emoji: string) => {
    const codePoints = [];
    for (let i = 0; i < emoji.length; i++) {
      const codePoint = emoji.codePointAt(i);
      if (codePoint) {
        codePoints.push(codePoint.toString(16).toLowerCase());
        // Если это surrogate pair, пропускаем следующий символ
        if (codePoint >= 0x10000) i++;
      }
    }
    
    const unified = codePoints.join('-');
    // Используем Apple emoji изображения с CDN
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.0/img/apple/64/${unified}.png`;
  };

  return useImage ? (
    <img 
      src={getAppleEmojiUrl(emoji)}
      alt={emoji}
      className={`apple-emoji-img ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        objectFit: 'contain',
        verticalAlign: 'middle'
      }}
      onError={() => setUseImage(false)}
    />
  ) : (
    <span 
      className={`apple-emoji-fallback ${className}`} 
      style={{ 
        fontSize: `${size}px`,
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        lineHeight: 1,
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    >
      {emoji}
    </span>
  );
};

// Обратная совместимость
export const EmojiImage = AppleEmojiImage;