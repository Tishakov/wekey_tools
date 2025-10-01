const { Newsletter, NewsletterRecipient, User } = require('../config/database');
const { Op, literal } = require('sequelize');
const { sendEmail, sendBulkEmail } = require('../utils/sendEmail');
const { sequelize } = require('../config/database');

const newsletterController = {
  // Получить все рассылки с пагинацией и фильтрацией
  async getAllNewsletters(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Фильтр по статусу
      if (status && status !== 'all') {
        where.status = status;
      }

      // Поиск по названию или описанию
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const newsletters = await Newsletter.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: NewsletterRecipient,
            as: 'recipients',
            attributes: ['id', 'status', 'sentAt'],
            required: false
          }
        ]
      });

      // Добавляем статистику для каждой рассылки
      const newslettersWithStats = newsletters.rows.map(newsletter => {
        const recipients = newsletter.recipients || [];
        const totalRecipients = recipients.length;
        const sentCount = recipients.filter(r => r.status === 'sent').length;
        const deliveredCount = recipients.filter(r => r.status === 'delivered').length;
        const failedCount = recipients.filter(r => r.status === 'failed').length;

        return {
          ...newsletter.toJSON(),
          stats: {
            totalRecipients,
            sentCount,
            deliveredCount,
            failedCount,
            deliveryRate: totalRecipients > 0 ? Math.round((deliveredCount / totalRecipients) * 100) : 0
          }
        };
      });

      res.json({
        newsletters: newslettersWithStats,
        totalCount: newsletters.count,
        totalPages: Math.ceil(newsletters.count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error getting newsletters:', error);
      res.status(500).json({ error: 'Ошибка получения рассылок' });
    }
  },

  // Создать новую рассылку
  async createNewsletter(req, res) {
    try {
      const {
        title,
        description,
        subject,
        content,
        targetAudience,
        segmentCriteria,
        scheduledAt
      } = req.body;

      // Валидация обязательных полей
      if (!title || !subject || !content) {
        return res.status(400).json({ 
          error: 'Название, тема письма и содержание обязательны' 
        });
      }

      const newsletter = await Newsletter.create({
        title,
        description,
        subject,
        content,
        targetAudience: targetAudience || 'all',
        segmentCriteria: segmentCriteria || {},
        scheduledAt: scheduledAt || null,
        status: 'draft',
        createdBy: req.user.id // Предполагаем, что у нас есть middleware для аутентификации
      });

      res.status(201).json(newsletter);
    } catch (error) {
      console.error('Error creating newsletter:', error);
      res.status(500).json({ error: 'Ошибка создания рассылки' });
    }
  },

  // Получить конкретную рассылку
  async getNewsletter(req, res) {
    try {
      console.log('🔍 getNewsletter called with ID:', req.params.id);
      const { id } = req.params;

      console.log('📊 Attempting to find newsletter with Sequelize...');
      console.log('📦 Newsletter model:', typeof Newsletter);
      console.log('📦 NewsletterRecipient model:', typeof NewsletterRecipient);
      console.log('📦 User model:', typeof User);

      const newsletter = await Newsletter.findByPk(id, {
        include: [
          {
            model: NewsletterRecipient,
            as: 'recipients',
            include: [
              {
                model: User,
                attributes: ['id', 'email', 'username']
              }
            ]
          }
        ]
      });

      console.log('📄 Newsletter found:', !!newsletter);

      if (!newsletter) {
        console.log('❌ Newsletter not found');
        return res.status(404).json({ error: 'Рассылка не найдена' });
      }

      console.log('✅ Returning newsletter:', newsletter.title);
      res.json(newsletter);
    } catch (error) {
      console.error('❌ Error getting newsletter:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ error: 'Ошибка получения рассылки', details: error.message });
    }
  },

  // Обновить рассылку
  async updateNewsletter(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        subject,
        content,
        targetAudience,
        segmentCriteria,
        scheduledAt
      } = req.body;

      const newsletter = await Newsletter.findByPk(id);

      if (!newsletter) {
        return res.status(404).json({ error: 'Рассылка не найдена' });
      }

      // Проверяем, что рассылка ещё не отправлена
      if (newsletter.status === 'sent') {
        return res.status(400).json({ 
          error: 'Нельзя редактировать уже отправленную рассылку' 
        });
      }

      await newsletter.update({
        title,
        description,
        subject,
        content,
        targetAudience,
        segmentCriteria,
        scheduledAt
      });

      res.json(newsletter);
    } catch (error) {
      console.error('Error updating newsletter:', error);
      res.status(500).json({ error: 'Ошибка обновления рассылки' });
    }
  },

  // Удалить рассылку
  async deleteNewsletter(req, res) {
    try {
      const { id } = req.params;

      const newsletter = await Newsletter.findByPk(id);

      if (!newsletter) {
        return res.status(404).json({ error: 'Рассылка не найдена' });
      }

      // Проверяем, что рассылка ещё не отправлена
      if (newsletter.status === 'sent') {
        return res.status(400).json({ 
          error: 'Нельзя удалить уже отправленную рассылку' 
        });
      }

      // Удаляем связанных получателей
      await NewsletterRecipient.destroy({
        where: { newsletterId: id }
      });

      await newsletter.destroy();

      res.json({ message: 'Рассылка успешно удалена' });
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      res.status(500).json({ error: 'Ошибка удаления рассылки' });
    }
  },

  // Получить аудиторию для рассылки
  async getNewsletterAudience(req, res) {
    try {
      const { targetAudience, segmentCriteria } = req.body;

      let users = [];

      if (targetAudience === 'all') {
        users = await User.findAll({
          attributes: ['id', 'email', 'username', 'createdAt', 'isEmailVerified']
        });
      } else if (targetAudience === 'segment' && segmentCriteria) {
        const where = {};

        // Фильтр по дате регистрации
        if (segmentCriteria.registrationDate) {
          const { from, to } = segmentCriteria.registrationDate;
          if (from) where.createdAt = { [Op.gte]: new Date(from) };
          if (to) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(to) };
        }

        // Фильтр по статусу верификации email
        if (segmentCriteria.emailVerified !== undefined) {
          where.isEmailVerified = segmentCriteria.emailVerified;
        }

        // Фильтр по активности (последний вход)
        if (segmentCriteria.lastActivity) {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - segmentCriteria.lastActivity);
          where.lastLoginAt = { [Op.gte]: daysAgo };
        }

        users = await User.findAll({
          where,
          attributes: ['id', 'email', 'username', 'createdAt', 'isEmailVerified']
        });
      }

      res.json({
        users,
        count: users.length
      });
    } catch (error) {
      console.error('Error getting newsletter audience:', error);
      res.status(500).json({ error: 'Ошибка получения аудитории' });
    }
  },

  // Отправить рассылку
  async sendNewsletter(req, res) {
    try {
      const { id } = req.params;

      const newsletter = await Newsletter.findByPk(id);

      if (!newsletter) {
        return res.status(404).json({ error: 'Рассылка не найдена' });
      }

      if (newsletter.status === 'sent') {
        return res.status(400).json({ error: 'Рассылка уже отправлена' });
      }

      // Получаем список получателей
      const audience = await newsletterController.getNewsletterAudience(
        { body: { targetAudience: newsletter.targetAudience, segmentCriteria: newsletter.segmentCriteria } },
        { json: (data) => data }
      );

      const users = audience.users;

      if (users.length === 0) {
        return res.status(400).json({ error: 'Нет получателей для рассылки' });
      }

      // Обновляем статус рассылки
      await newsletter.update({ 
        status: 'sending',
        sentAt: new Date()
      });

      // Создаём записи получателей и отправляем письма
      let successCount = 0;
      let failureCount = 0;

      for (const user of users) {
        try {
          // Создаём запись получателя
          const recipient = await NewsletterRecipient.create({
            newsletterId: newsletter.id,
            userId: user.id,
            email: user.email,
            status: 'pending'
          });

          // Отправляем письмо
          await sendEmail(
            user.email,
            newsletter.subject,
            newsletter.content,
            newsletter.content // HTML content
          );

          // Обновляем статус на отправлено
          await recipient.update({
            status: 'sent',
            sentAt: new Date()
          });

          successCount++;
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
          
          // Создаём запись с ошибкой
          await NewsletterRecipient.create({
            newsletterId: newsletter.id,
            userId: user.id,
            email: user.email,
            status: 'failed',
            sentAt: new Date(),
            error: emailError.message
          });

          failureCount++;
        }
      }

      // Обновляем статус рассылки
      await newsletter.update({
        status: 'sent',
        totalRecipients: users.length,
        sentCount: successCount,
        failedCount: failureCount
      });

      res.json({
        message: 'Рассылка отправлена',
        stats: {
          totalRecipients: users.length,
          successCount,
          failureCount
        }
      });
    } catch (error) {
      console.error('Error sending newsletter:', error);
      res.status(500).json({ error: 'Ошибка отправки рассылки' });
    }
  },

  // Получить статистику рассылки
  async getNewsletterStats(req, res) {
    try {
      const { id } = req.params;

      const newsletter = await Newsletter.findByPk(id, {
        include: [
          {
            model: NewsletterRecipient,
            as: 'recipients'
          }
        ]
      });

      if (!newsletter) {
        return res.status(404).json({ error: 'Рассылка не найдена' });
      }

      const recipients = newsletter.recipients || [];
      const stats = {
        totalRecipients: recipients.length,
        sentCount: recipients.filter(r => r.status === 'sent').length,
        deliveredCount: recipients.filter(r => r.status === 'delivered').length,
        failedCount: recipients.filter(r => r.status === 'failed').length,
        pendingCount: recipients.filter(r => r.status === 'pending').length
      };

      stats.deliveryRate = stats.totalRecipients > 0 
        ? Math.round((stats.deliveredCount / stats.totalRecipients) * 100) 
        : 0;

      res.json(stats);
    } catch (error) {
      console.error('Error getting newsletter stats:', error);
      res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  }
};

module.exports = newsletterController;