/**
 * Роуты для User tracking аналитики
 * Обрабатывает посетителей и события пользователей
 */

const express = require('express');
const router = express.Router();

const { Visitor, AnalyticsEvent } = require('../models');

/**
 * POST /api/analytics/visitor - Обновление данных посетителя
 */
router.post('/visitor', async (req, res, next) => {
  try {
    console.log('📊 [USER ANALYTICS] Visitor data received:', req.body);
    
    const {
      userId,
      firstVisit,
      lastVisit,
      sessionsCount,
      pagesViewed,
      hasUsedTools,
      toolsUsed,
      userAgent,
      referrer
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }

    // Ищем существующего посетителя или создаем нового
    const [visitor, created] = await Visitor.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        firstVisit: firstVisit || new Date(),
        lastVisit: lastVisit || new Date(),
        sessionsCount: sessionsCount || 1,
        pagesViewed: JSON.stringify(pagesViewed || []),
        hasUsedTools: hasUsedTools || false,
        toolsUsed: JSON.stringify(toolsUsed || []),
        userAgent: userAgent || '',
        referrer: referrer || ''
      }
    });

    // Если посетитель уже существует, обновляем данные
    if (!created) {
      await visitor.update({
        lastVisit: lastVisit || new Date(),
        sessionsCount: sessionsCount || visitor.sessionsCount + 1,
        pagesViewed: JSON.stringify(pagesViewed || visitor.getPagesViewed()),
        hasUsedTools: hasUsedTools || visitor.hasUsedTools,
        toolsUsed: JSON.stringify(toolsUsed || visitor.getToolsUsed()),
        userAgent: userAgent || visitor.userAgent,
        referrer: referrer || visitor.referrer
      });
    }

    console.log(`📊 [USER ANALYTICS] Visitor ${created ? 'created' : 'updated'} for user:`, userId);
    
    res.json({
      success: true,
      visitor: {
        userId: visitor.userId,
        isNew: created,
        sessionsCount: visitor.sessionsCount,
        hasUsedTools: visitor.hasUsedTools
      }
    });

  } catch (error) {
    console.error('❌ [USER ANALYTICS] Error processing visitor data:', error);
    next(error);
  }
});

/**
 * POST /api/analytics/event - Обработка событий аналитики
 */
router.post('/event', async (req, res, next) => {
  try {
    console.log('📊 [USER ANALYTICS] Event received:', req.body);
    
    const {
      userId,
      event,
      data
    } = req.body;

    if (!userId || !event) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or event'
      });
    }

    const validEvents = ['page_view', 'tool_usage', 'session_start'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type'
      });
    }

    // Создаем событие в базе данных
    const analyticsEvent = await AnalyticsEvent.create({
      userId,
      event,
      page: data?.page || null,
      tool: data?.tool || null,
      timestamp: data?.timestamp ? new Date(data.timestamp) : new Date(),
      userAgent: data?.userAgent || '',
      referrer: data?.referrer || '',
      sessionId: data?.sessionId || null
    });

    console.log('📊 [USER ANALYTICS] Event saved:', analyticsEvent.id, 'for user:', userId);
    
    res.json({
      success: true,
      event: {
        id: analyticsEvent.id,
        userId: analyticsEvent.userId,
        event: analyticsEvent.event,
        timestamp: analyticsEvent.timestamp
      }
    });

  } catch (error) {
    console.error('❌ [USER ANALYTICS] Error saving event:', error);
    next(error);
  }
});

/**
 * GET /api/analytics/stats - Публичная статистика аналитики
 */
router.get('/stats', async (req, res, next) => {
  try {
    console.log('📊 [USER ANALYTICS] Public stats requested');

    // Общая статистика посетителей
    const totalVisitors = await Visitor.count();
    const toolUsers = await Visitor.count({ where: { hasUsedTools: true } });
    
    // Общее количество событий
    const totalEvents = await AnalyticsEvent.count();
    const pageViews = await AnalyticsEvent.count({ where: { event: 'page_view' } });
    const toolUsages = await AnalyticsEvent.count({ where: { event: 'tool_usage' } });

    // Статистика за последние 30 дней
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentVisitors = await Visitor.count({
      where: {
        lastVisit: {
          [require('sequelize').Op.gte]: thirtyDaysAgo
        }
      }
    });

    const stats = {
      visitors: {
        total: totalVisitors,
        withTools: toolUsers,
        recent30Days: recentVisitors
      },
      events: {
        total: totalEvents,
        pageViews: pageViews,
        toolUsages: toolUsages
      },
      conversionRate: totalVisitors > 0 ? ((toolUsers / totalVisitors) * 100).toFixed(1) : 0
    };

    console.log('📊 [USER ANALYTICS] Public stats response:', stats);
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [USER ANALYTICS] Error getting public stats:', error);
    next(error);
  }
});

/**
 * GET /api/analytics/history - Исторические данные для графиков
 */
router.get('/history', async (req, res, next) => {
  try {
    console.log('📊 [USER ANALYTICS] History requested:', req.query);
    
    const { period = '7d' } = req.query;
    
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '7d') days = 7;
    if (period === '1d') days = 1;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Группируем события по дням
    const events = await AnalyticsEvent.findAll({
      where: {
        timestamp: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('timestamp')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        'event'
      ],
      group: ['date', 'event'],
      order: [['date', 'ASC']]
    });

    // Формируем данные для графика
    const historyData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(e => e.get('date') === dateStr);
      const pageViews = dayEvents.find(e => e.event === 'page_view')?.get('count') || 0;
      const toolUsages = dayEvents.find(e => e.event === 'tool_usage')?.get('count') || 0;
      
      historyData.push({
        date: dateStr,
        pageViews: parseInt(pageViews),
        toolUsages: parseInt(toolUsages),
        total: parseInt(pageViews) + parseInt(toolUsages)
      });
    }

    console.log('📊 [USER ANALYTICS] History response:', historyData.length, 'days');
    res.json({
      success: true,
      data: historyData
    });

  } catch (error) {
    console.error('❌ [USER ANALYTICS] Error getting history:', error);
    next(error);
  }
});

module.exports = router;