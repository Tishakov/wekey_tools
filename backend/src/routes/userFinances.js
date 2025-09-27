const express = require('express');
const router = express.Router();
const { CoinTransaction, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { protect } = require('../middleware/auth');

// Функция для получения понятного названия инструмента
function getToolDisplayName(toolKey) {
  const displayNames = {
    'add_symbol_tool': 'Добавление символов',
    'analytics_tool': 'Аналитика',
    'case_changer_tool': 'Изменение регистра',
    'char_counter_tool': 'Счетчик символов',
    'cross_analytics_tool': 'Кросс-аналитика',
    'duplicate_finder_tool': 'Поиск дубликатов',
    'duplicate_removal_tool': 'Удаление дубликатов',
    'emoji_tool': 'Эмодзи',
    'empty_lines_removal_tool': 'Удаление пустых строк',
    'find_replace_tool': 'Найти и заменить',
    'match_types_tool': 'Типы соответствий',
    'minus_words_tool': 'Минус-слова',
    'number_generator_tool': 'Генератор чисел',
    'password_generator_tool': 'Генератор паролей',
    'privacy_policy_generator_tool': 'Генератор политики конфиденциальности',
    'qr_generator_tool': 'Генератор QR-кодов',
    'remove_line_breaks_tool': 'Удаление переносов строк',
    'seo_audit_tool': 'SEO аудит',
    'seo_audit_pro_tool': 'SEO аудит Pro',
    'site_audit_tool': 'Аудит сайта',
    'spaces_to_paragraphs_tool': 'Пробелы в абзацы',
    'synonym_generator_tool': 'Генератор синонимов',
    'text_by_columns_tool': 'Текст по столбцам',
    'text_generator_tool': 'Генератор текста',
    'text_optimizer_tool': 'Оптимизатор текста',
    'text_sorting_tool': 'Сортировка слов и строк',
    'text_to_html_tool': 'Текст в HTML',
    'transliteration_tool': 'Транслитерация',
    'utm_generator_tool': 'Генератор UTM-меток',
    'word_gluing_tool': 'Склейка слов',
    'word_inflection_tool': 'Склонение слов',
    'word_mixer_tool': 'Миксация слов',
    // Поддержка старых названий без _tool
    'transliteration': 'Транслитерация',
    'utm-generator': 'Генератор UTM-меток',
    'char-counter': 'Счетчик символов',
    'text-optimizer': 'Оптимизатор текста',
    'duplicate-finder': 'Поиск дубликатов',
    'duplicate-removal': 'Удаление дубликатов',
    'text-to-html': 'Текст в HTML',
    'synonym-generator': 'Генератор синонимов',
    'word-declension': 'Склонение слов',
    'password-generator': 'Генератор паролей',
    'text-generator': 'Генератор текста',
    'number-generator': 'Генератор чисел',
    'add-symbol': 'Добавление символов',
    'case-changer': 'Изменение регистра',
    'word-mixer': 'Миксация слов',
    'find-replace': 'Найти и заменить',
    'minus-words': 'Минус-слова',
    'spaces-to-paragraphs': 'Пробелы в абзацы',
    'text-sorting': 'Сортировка слов и строк',
    'remove-empty-lines': 'Удаление пустых строк',
    'emoji': 'Эмодзи',
    'cross-analytics': 'Кросс-аналитика',
    'word-gluing': 'Склейка слов',
    'remove-line-breaks': 'Удаление переносов строк',
    'text-by-columns': 'Текст по столбцам',
    'match-types': 'Типы соответствий',
    'site-audit': 'Аудит сайта',
    'seo-audit': 'SEO аудит',
    'seo-audit-pro': 'SEO аудит Pro',
    'privacy-policy-generator': 'Генератор политики конфиденциальности',
    'qr-generator': 'Генератор QR-кодов'
  };
  return displayNames[toolKey] || toolKey;
}

// Функция для обработки описания транзакции
function processTransactionDescription(description) {
  if (!description) return description;
  
  // Обработка "Tool usage: toolName"
  const toolUsageMatch = description.match(/^Tool usage:\s*(.+)$/);
  if (toolUsageMatch) {
    const toolName = toolUsageMatch[1];
    const displayName = getToolDisplayName(toolName);
    return `Инструмент: ${displayName}`;
  }
  
  // Обработка других типов описаний
  const translations = {
    'Registration bonus': 'Бонус за регистрацию',
    'Admin bonus': 'Бонус от администратора',
    'Correction balance': 'Корректировка баланса',
    'Gift from administration': 'Подарок от администрации'
  };
  
  return translations[description] || description;
}

// Получение истории транзакций текущего пользователя
router.get('/coin-transactions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Фильтры
    const whereClause = { userId };
    
    if (req.query.type) {
      whereClause.type = req.query.type;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      whereClause.createdAt = {};
      if (req.query.dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        whereClause.createdAt[Op.lte] = new Date(req.query.dateTo);
      }
    }

    // Получение транзакций
    const { count, rows: transactions } = await CoinTransaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'type',
        'amount',
        'description',
        'balanceAfter',
        'createdAt'
      ]
    });

    // Получение текущего баланса пользователя
    const user = await User.findByPk(userId, {
      attributes: ['coinBalance']
    });

    // Обработка описаний транзакций
    const processedTransactions = transactions.map(transaction => ({
      ...transaction.toJSON(),
      description: processTransactionDescription(transaction.description)
    }));

    res.json({
      success: true,
      data: {
        transactions: processedTransactions,
        currentBalance: user.coinBalance || 0,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user coin transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении истории транзакций'
    });
  }
});

// Получение статистики по транзакциям
router.get('/coin-stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Общая статистика
    const totalReceived = await CoinTransaction.sum('amount', {
      where: {
        userId,
        amount: { [Op.gt]: 0 }
      }
    }) || 0;

    const totalSpent = await CoinTransaction.sum('amount', {
      where: {
        userId,
        amount: { [Op.lt]: 0 }
      }
    }) || 0;

    const transactionCount = await CoinTransaction.count({
      where: { userId }
    });

    // Статистика по типам за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await CoinTransaction.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['type']
    });

    res.json({
      success: true,
      data: {
        totalReceived: Math.abs(totalReceived),
        totalSpent: Math.abs(totalSpent),
        transactionCount,
        recentStats
      }
    });

  } catch (error) {
    console.error('Error fetching user coin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики'
    });
  }
});

module.exports = router;