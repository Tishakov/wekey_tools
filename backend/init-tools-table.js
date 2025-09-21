const { Tool, sequelize } = require('./src/models');

// Данные инструментов из frontend/src/utils/toolsConfig.ts
const toolsConfig = [
  {
    id: 'synonym-generator',
    title: 'Генератор синонимов',
    description: 'Поиск синонимов к словам',
    icon: '/icons/tool_generator_sinonimov.svg',
    path: '/synonym-generator',
    category: 'generators'
  },
  {
    id: 'password-generator',
    title: 'Генератор паролей',
    description: 'Создание надежных паролей',
    icon: '/icons/tool_generator_paroley.svg',
    path: '/password-generator',
    category: 'generators'
  },
  {
    id: 'text-generator',
    title: 'Генератор текста',
    description: 'Создание случайного текста',
    icon: '/icons/tool_generator_teksta.svg',
    path: '/text-generator',
    category: 'generators'
  },
  {
    id: 'number-generator',
    title: 'Генератор чисел',
    description: 'Генерация случайных чисел',
    icon: '/icons/tool_generator_chisel.svg',
    path: '/number-generator',
    category: 'generators'
  },
  {
    id: 'utm-generator',
    title: 'Генератор UTM-меток',
    description: 'Создание UTM-параметров для отслеживания кампаний',
    icon: '/icons/tool_generator_utm_metok.svg',
    path: '/utm-generator',
    category: 'generators'
  },
  {
    id: 'add-symbol',
    title: 'Добавление символа',
    description: 'Добавление символов к тексту',
    icon: '/icons/tool_dobavlenie_simvola.svg',
    path: '/add-symbol',
    category: 'text-processing'
  },
  {
    id: 'case-changer',
    title: 'Изменения регистра',
    description: 'Изменение регистра текста',
    icon: '/icons/tool_izmeneniya_registra.svg',
    path: '/case-changer',
    category: 'text-processing'
  },
  {
    id: 'char-counter',
    title: 'Количество символов',
    description: 'Подсчет символов, слов и строк в тексте',
    icon: '/icons/tool_kolichestvo_simvolov.svg',
    path: '/char-counter',
    category: 'text-analysis'
  },
  {
    id: 'find-replace',
    title: 'Найти и заменить',
    description: 'Поиск и замена текста',
    icon: '/icons/tool_nayti_i_zamenit.svg',
    path: '/find-replace',
    category: 'text-processing'
  },
  {
    id: 'minus-words',
    title: 'Обработка минус-слов',
    description: 'Работа с минус-словами',
    icon: '/icons/tool_obrabotka_minus_slov.svg',
    path: '/minus-words',
    category: 'seo'
  },
  {
    id: 'text-optimizer',
    title: 'Оптимизатор текста',
    description: 'Улучшение читаемости и структуры текста',
    icon: '/icons/tool_optimizator_teksta.svg',
    path: '/text-optimizer',
    category: 'text-processing'
  },
  {
    id: 'duplicate-finder',
    title: 'Поиск дубликатов',
    description: 'Поиск и удаление дубликатов в списках',
    icon: '/icons/tool_poisk_dublikatov.svg',
    path: '/duplicate-finder',
    category: 'text-analysis'
  },
  {
    id: 'spaces-to-paragraphs',
    title: 'Пробелы на абзацы',
    description: 'Преобразование пробелов в абзацы',
    icon: '/icons/tool_probeli_na_abzacy.svg',
    path: '/spaces-to-paragraphs',
    category: 'text-processing'
  },
  {
    id: 'cross-analytics',
    title: 'Сквозная аналитика',
    description: 'Инструмент для анализа воронки продаж и маркетинговых метрик',
    icon: '/icons/tool_skvoznaya_analitika.svg',
    path: '/cross-analytics',
    category: 'analytics'
  },
  {
    id: 'word-gluing',
    title: 'Склейка слов',
    description: 'Склеивание слов в текте',
    icon: '/icons/tool_sklejka_slov.svg',
    path: '/word-gluing',
    category: 'text-processing'
  },
  {
    id: 'word-mixer',
    title: 'Миксация слов',
    description: 'Создание всех возможных комбинаций слов из списков',
    icon: '/icons/tool_miksaciya_slov.svg',
    path: '/word-mixer',
    category: 'text-processing'
  },
  {
    id: 'remove-line-breaks',
    title: 'Удаление переносов',
    description: 'Удаление переносов строк в тексте',
    icon: '/icons/tool_udalenie_perenosov.svg',
    path: '/remove-line-breaks',
    category: 'text-processing'
  },
  {
    id: 'word-declension',
    title: 'Склонение слов',
    description: 'Склонение слов по падежам',
    icon: '/icons/tool_sklonenie_slov.svg',
    path: '/word-declension',
    category: 'text-processing'
  },
  {
    id: 'text-sorting',
    title: 'Сортировка слов и строк',
    description: 'Сортировка текста по алфавиту',
    icon: '/icons/tool_sortirovka_slov_i_strok.svg',
    path: '/text-sorting',
    category: 'text-processing'
  },
  {
    id: 'text-to-html',
    title: 'Текст в HTML',
    description: 'Конвертация текста в HTML-формат',
    icon: '/icons/tool_tekst_v_html.svg',
    path: '/text-to-html',
    category: 'converters'
  },
  {
    id: 'transliteration',
    title: 'Транслитерация',
    description: 'Преобразование кириллицы в латиницу и обратно',
    icon: '/icons/tool_transliteraciya.svg',
    path: '/transliteration',
    category: 'converters'
  },
  {
    id: 'remove-duplicates',
    title: 'Удаление дубликатов',
    description: 'Удаление повторяющихся строк',
    icon: '/icons/tool_udalenie_dublikatov.svg',
    path: '/duplicate-removal',
    category: 'text-processing'
  },
  {
    id: 'remove-empty-lines',
    title: 'Удаление пустых строк',
    description: 'Удаление пустых строк из текста',
    icon: '/icons/tool_udalenie_pustyh_strok.svg',
    path: '/remove-empty-lines',
    category: 'text-processing'
  },
  {
    id: 'text-by-columns',
    title: 'Текст по столбцам',
    description: 'Разделение текста на колонки по разделителю',
    icon: '/icons/tool_tekst_po_stolbcam.svg',
    path: '/text-by-columns',
    category: 'text-processing'
  },
  {
    id: 'match-types',
    title: 'Типы соответствия',
    description: 'Обработка текста по типам соответствия (широкое, фразовое, точное)',
    icon: '/icons/tool_tipy_sootvetstviya.svg',
    path: '/match-types',
    category: 'text-processing'
  },
  {
    id: 'emoji',
    title: 'Эмодзи',
    description: 'Работа с эмодзи и символами',
    icon: '/icons/tool_emoji.svg',
    path: '/emoji',
    category: 'text-processing'
  }
];

async function initializeToolsTable() {
  try {
    console.log('🔧 Создание таблицы инструментов...');
    
    // Создание таблицы если её нет
    await Tool.sync({ force: false });
    
    console.log('📊 Заполнение таблицы данными из toolsConfig...');
    
    // Заполнение таблицы данными из конфига
    for (let i = 0; i < toolsConfig.length; i++) {
      const toolData = toolsConfig[i];
      
      // Проверяем, существует ли уже такой инструмент
      const existingTool = await Tool.findOne({ 
        where: { toolId: toolData.id }
      });
      
      if (!existingTool) {
        await Tool.create({
          toolId: toolData.id,
          name: toolData.title,
          description: toolData.description,
          icon: toolData.icon,
          path: toolData.path,
          category: toolData.category,
          isActive: true, // По умолчанию все инструменты активны
          order: i + 1 // Порядок из массива
        });
        console.log(`✅ Добавлен: ${toolData.title}`);
      } else {
        console.log(`⚠️  Уже существует: ${toolData.title}`);
      }
    }
    
    console.log('🎉 Инициализация таблицы инструментов завершена!');
    
    // Показать текущее состояние
    const allTools = await Tool.findAll({ order: [['order', 'ASC']] });
    console.log(`📋 Всего инструментов в БД: ${allTools.length}`);
    console.log(`✅ Активных: ${allTools.filter(t => t.isActive).length}`);
    console.log(`❌ Отключенных: ${allTools.filter(t => !t.isActive).length}`);
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации таблицы инструментов:', error);
  } finally {
    await sequelize.close();
  }
}

// Запуск инициализации
initializeToolsTable();