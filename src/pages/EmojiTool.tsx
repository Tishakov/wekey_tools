import React from 'react';

const EmojiTool: React.FC = () => {
  return (
    <div className="tool-page">
      <div className="tool-header">
        <div className="tool-header-icon">
          <img src="/icons/tool_emoji.svg" alt="Эмодзи" />
        </div>
        <h1>Эмодзи</h1>
        <p>Работа с эмодзи и символами</p>
      </div>
      
      <div className="tool-content">
        {/* Функционал инструмента будет добавлен здесь */}
      </div>
    </div>
  );
};

export default EmojiTool;
