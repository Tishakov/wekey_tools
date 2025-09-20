import React from 'react';

const HomeSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1C1D1F', minHeight: '100vh' }}>
      <h1>Test Home Page</h1>
      <p>Если вы видите этот текст, значит React работает.</p>
      <button onClick={() => alert('Кнопка работает!')}>
        Тест кнопки
      </button>
    </div>
  );
};

export default HomeSimple;