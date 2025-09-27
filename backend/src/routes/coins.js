const express = require('express');
const { protect } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { CoinTransaction } = require('../config/database');

const router = express.Router();

// Защита всех роутов - только для авторизованных пользователей
router.use(protect);

// POST /api/coins/spend - Потратить коины на использование инструмента
router.post('/spend', async (req, res, next) => {
  try {
    console.log('🪙 Spending coins for user:', req.user.id, req.user.email);
    console.log('🪙 Current balance:', req.user.coinBalance);
    console.log('🪙 Request body:', req.body);
    
    const { toolName, amount = 1 } = req.body;
    
    if (!toolName) {
      return next(new AppError('Название инструмента обязательно', 400));
    }

    // Проверяем баланс пользователя
    if (req.user.coinBalance < amount) {
      return next(new AppError('Недостаточно коинов для использования инструмента', 400));
    }

    // Создаем транзакцию траты коинов
    console.log('🪙 Creating transaction...');
    const result = await CoinTransaction.spendForTool(req.user.id, toolName, amount);
    console.log('🪙 Transaction result:', result);
    
    // Перезагружаем пользователя для получения актуального баланса
    await req.user.reload();

    res.json({
      success: true,
      message: `Потрачено ${amount} коин${amount > 1 ? 'ов' : ''} на использование ${toolName}`,
      data: {
        transaction: {
          id: result.transaction.id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          balanceBefore: result.transaction.balanceBefore,
          balanceAfter: result.transaction.balanceAfter,
          toolName: result.transaction.toolName
        },
        newBalance: req.user.coinBalance
      }
    });

  } catch (error) {
    console.error('❌ Error spending coins:', error);
    next(error);
  }
});

// GET /api/coins/history - История транзакций коинов
router.get('/history', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (type) {
      whereClause.type = type;
    }

    const transactions = await CoinTransaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        pagination: {
          total: transactions.count,
          page: parseInt(page),
          pages: Math.ceil(transactions.count / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/coins/balance - Получить текущий баланс коинов
router.get('/balance', async (req, res, next) => {
  try {
    // Перезагружаем пользователя для получения актуального баланса
    await req.user.reload();

    res.json({
      success: true,
      data: {
        balance: req.user.coinBalance,
        userId: req.user.id
      }
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/coins/admin/add - Административное добавление коинов (только для админов)
router.post('/admin/add', async (req, res, next) => {
  try {
    // Проверяем права администратора
    if (req.user.role !== 'admin') {
      return next(new AppError('Доступ запрещен', 403));
    }

    const { userId, amount, description } = req.body;
    
    if (!userId || !amount) {
      return next(new AppError('ID пользователя и количество коинов обязательны', 400));
    }

    if (amount <= 0) {
      return next(new AppError('Количество коинов должно быть положительным', 400));
    }

    // Создаем административную транзакцию добавления коинов
    const transaction = await CoinTransaction.createTransaction(
      userId,
      'admin_add',
      amount,
      null,
      description || 'Административное добавление коинов'
    );

    res.json({
      success: true,
      message: `Добавлено ${amount} коин${amount > 1 ? 'ов' : ''} пользователю ID ${userId}`,
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;