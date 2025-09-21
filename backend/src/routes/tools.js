const express = require('express');
const router = express.Router();
const { Tool } = require('../models');
const { protect } = require('../middleware/auth');

// Получить все инструменты (только для админов)
router.get('/tools', protect, async (req, res) => {
  try {
    const tools = await Tool.findAll({
      order: [['order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      tools: tools.map(tool => ({
        id: tool.id,
        toolId: tool.toolId,
        name: tool.name,
        description: tool.description,
        icon: tool.icon,
        path: tool.path,
        category: tool.category,
        isActive: tool.isActive,
        order: tool.order,
        createdAt: tool.createdAt,
        updatedAt: tool.updatedAt
      }))
    });
  } catch (error) {
    console.error('Ошибка при получении списка инструментов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении списка инструментов'
    });
  }
});

// Получить активные инструменты (публичный endpoint)
router.get('/tools/active', async (req, res) => {
  try {
    const tools = await Tool.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      tools: tools.map(tool => ({
        id: tool.toolId, // Возвращаем toolId как id для совместимости с frontend
        title: tool.name,
        description: tool.description,
        icon: tool.icon,
        path: tool.path,
        category: tool.category
      }))
    });
  } catch (error) {
    console.error('Ошибка при получении активных инструментов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении активных инструментов'
    });
  }
});

// Обновить статус инструмента (включить/отключить)
router.patch('/tools/:id/toggle', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const tool = await Tool.findByPk(id);
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Инструмент не найден'
      });
    }

    // Переключаем статус
    tool.isActive = !tool.isActive;
    await tool.save();

    res.json({
      success: true,
      tool: {
        id: tool.id,
        toolId: tool.toolId,
        name: tool.name,
        isActive: tool.isActive
      },
      message: `Инструмент "${tool.name}" ${tool.isActive ? 'включен' : 'отключен'}`
    });
  } catch (error) {
    console.error('Ошибка при переключении статуса инструмента:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при переключении статуса инструмента'
    });
  }
});

// Обновить порядок инструментов
router.patch('/tools/reorder', protect, async (req, res) => {
  try {
    const { toolsOrder } = req.body; // Массив объектов {id, order}

    if (!Array.isArray(toolsOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо передать массив с порядком инструментов'
      });
    }

    // Обновляем порядок для каждого инструмента
    const updatePromises = toolsOrder.map(item => 
      Tool.update(
        { order: item.order },
        { where: { id: item.id } }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Порядок инструментов обновлен'
    });
  } catch (error) {
    console.error('Ошибка при изменении порядка инструментов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при изменении порядка инструментов'
    });
  }
});

// Получить статистику по инструментам
router.get('/tools/stats', protect, async (req, res) => {
  try {
    const totalTools = await Tool.count();
    const activeTools = await Tool.count({ where: { isActive: true } });
    const inactiveTools = totalTools - activeTools;

    // Группировка по категориям
    const categories = await Tool.findAll({
      attributes: [
        'category',
        [Tool.sequelize.fn('COUNT', Tool.sequelize.col('*')), 'count'],
        [Tool.sequelize.fn('SUM', Tool.sequelize.literal('CASE WHEN is_active = 1 THEN 1 ELSE 0 END')), 'activeCount']
      ],
      group: ['category'],
      order: [['category', 'ASC']]
    });

    res.json({
      success: true,
      stats: {
        totalTools,
        activeTools,
        inactiveTools,
        categories: categories.map(cat => ({
          category: cat.category,
          total: parseInt(cat.dataValues.count),
          active: parseInt(cat.dataValues.activeCount)
        }))
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики инструментов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики инструментов'
    });
  }
});

module.exports = router;