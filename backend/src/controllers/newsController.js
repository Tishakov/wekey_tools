const { News, NewsReadStatus, User } = require('../models');
const { Op } = require('sequelize');
const { sendEmail, sendBulkEmail } = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs').promises;

const newsController = {
  // Получить все новости с пагинацией и фильтрацией
  async getAllNews(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        priority,
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

      // Фильтр по приоритету
      if (priority && priority !== 'all') {
        where.priority = priority;
      }

      // Поиск по заголовку или содержанию
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { excerpt: { [Op.like]: `%${search}%` } }
        ];
      }

      const news = await News.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: NewsReadStatus,
            as: 'readStatuses',
            attributes: ['userId', 'readAt'],
            required: false
          }
        ]
      });

      // Добавляем статистику просмотров для каждой новости
      const newsWithStats = news.rows.map(newsItem => {
        const readStatuses = newsItem.readStatuses || [];
        const totalReads = readStatuses.length;

        return {
          ...newsItem.toJSON(),
          stats: {
            totalReads,
            isRead: req.user ? readStatuses.some(rs => rs.userId === req.user.id) : false
          }
        };
      });

      res.json({
        news: newsWithStats,
        totalCount: news.count,
        totalPages: Math.ceil(news.count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error getting news:', error);
      res.status(500).json({ error: 'Ошибка получения новостей' });
    }
  },

  // Создать новость
  async createNews(req, res) {
    try {
      const {
        title,
        content,
        excerpt,
        imageUrl,
        tags,
        priority,
        sendEmailNotification,
        publishAt,
        seoTitle,
        seoDescription,
        seoKeywords
      } = req.body;

      // Валидация обязательных полей
      if (!title || !content) {
        return res.status(400).json({ 
          error: 'Заголовок и содержание обязательны' 
        });
      }

      const news = await News.create({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        imageUrl,
        tags: tags || [],
        priority: priority || 'medium',
        sendEmailNotification: sendEmailNotification || false,
        publishAt: publishAt || null,
        status: publishAt ? 'scheduled' : 'draft',
        authorId: req.user.id,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        seoKeywords: seoKeywords || []
      });

      res.status(201).json(news);
    } catch (error) {
      console.error('Error creating news:', error);
      res.status(500).json({ error: 'Ошибка создания новости' });
    }
  },

  // Получить конкретную новость
  async getNews(req, res) {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'email']
          },
          {
            model: NewsReadStatus,
            as: 'readStatuses',
            include: [
              {
                model: User,
                attributes: ['id', 'username']
              }
            ]
          }
        ]
      });

      if (!news) {
        return res.status(404).json({ error: 'Новость не найдена' });
      }

      // Если пользователь авторизован, отмечаем новость как прочитанную
      if (req.user && news.status === 'published') {
        await NewsReadStatus.findOrCreate({
          where: {
            newsId: news.id,
            userId: req.user.id
          },
          defaults: {
            newsId: news.id,
            userId: req.user.id,
            readAt: new Date()
          }
        });

        // Увеличиваем счётчик просмотров
        await news.increment('viewCount');
      }

      res.json(news);
    } catch (error) {
      console.error('Error getting news:', error);
      res.status(500).json({ error: 'Ошибка получения новости' });
    }
  },

  // Обновить новость
  async updateNews(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        excerpt,
        imageUrl,
        tags,
        priority,
        sendEmailNotification,
        publishAt,
        seoTitle,
        seoDescription,
        seoKeywords
      } = req.body;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({ error: 'Новость не найдена' });
      }

      await news.update({
        title,
        content,
        excerpt,
        imageUrl,
        tags,
        priority,
        sendEmailNotification,
        publishAt,
        seoTitle,
        seoDescription,
        seoKeywords,
        updatedAt: new Date()
      });

      res.json(news);
    } catch (error) {
      console.error('Error updating news:', error);
      res.status(500).json({ error: 'Ошибка обновления новости' });
    }
  },

  // Удалить новость
  async deleteNews(req, res) {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({ error: 'Новость не найдена' });
      }

      // Удаляем связанные записи о прочтении
      await NewsReadStatus.destroy({
        where: { newsId: id }
      });

      // Удаляем изображение, если оно есть
      if (news.imageUrl) {
        try {
          const imagePath = path.join(__dirname, '../uploads', path.basename(news.imageUrl));
          await fs.unlink(imagePath);
        } catch (imageError) {
          console.warn('Could not delete image file:', imageError.message);
        }
      }

      await news.destroy();

      res.json({ message: 'Новость успешно удалена' });
    } catch (error) {
      console.error('Error deleting news:', error);
      res.status(500).json({ error: 'Ошибка удаления новости' });
    }
  },

  // Опубликовать новость
  async publishNews(req, res) {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({ error: 'Новость не найдена' });
      }

      if (news.status === 'published') {
        return res.status(400).json({ error: 'Новость уже опубликована' });
      }

      await news.update({
        status: 'published',
        publishedAt: new Date()
      });

      // Если включена отправка email уведомлений
      if (news.sendEmailNotification) {
        await newsController.sendNewsNotification(news);
      }

      res.json(news);
    } catch (error) {
      console.error('Error publishing news:', error);
      res.status(500).json({ error: 'Ошибка публикации новости' });
    }
  },

  // Архивировать новость
  async archiveNews(req, res) {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({ error: 'Новость не найдена' });
      }

      await news.update({
        status: 'archived',
        archivedAt: new Date()
      });

      res.json(news);
    } catch (error) {
      console.error('Error archiving news:', error);
      res.status(500).json({ error: 'Ошибка архивирования новости' });
    }
  },

  // Отправить email уведомление о новости
  async sendNewsNotification(newsItem) {
    try {
      // Получаем всех пользователей с подтверждённой почтой
      const users = await User.findAll({
        where: {
          isEmailVerified: true
        },
        attributes: ['id', 'email', 'username']
      });

      console.log(`Sending news notification to ${users.length} users`);

      // Создаём HTML шаблон для письма
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1C1D1F; color: #FFFFFF;">
          <div style="padding: 20px; background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);">
            <h1 style="margin: 0; color: white; font-size: 24px;">Новости WeKey Tools</h1>
          </div>
          
          <div style="padding: 30px; background: #28282A;">
            <h2 style="color: #FFFFFF; margin-bottom: 16px;">${newsItem.title}</h2>
            
            ${newsItem.imageUrl ? `
              <img src="${newsItem.imageUrl}" alt="${newsItem.title}" style="width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 16px;">
            ` : ''}
            
            <p style="color: #BCBBBD; line-height: 1.6; margin-bottom: 20px;">
              ${newsItem.excerpt}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/news/${newsItem.id}" 
                 style="background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%); 
                        color: white; 
                        text-decoration: none; 
                        padding: 12px 24px; 
                        border-radius: 8px; 
                        font-weight: 600;
                        display: inline-block;">
                Читать полностью
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background: #1C1D1F; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 12px;">
              Это письмо отправлено автоматически. Если вы не хотите получать такие уведомления, 
              вы можете отключить их в настройках профиля.
            </p>
          </div>
        </div>
      `;

      // Отправляем письма всем пользователям
      const emailPromises = users.map(user => 
        sendEmail(
          user.email,
          `📰 Новость: ${newsItem.title}`,
          emailContent,
          emailContent
        ).catch(error => {
          console.error(`Failed to send news notification to ${user.email}:`, error);
        })
      );

      await Promise.allSettled(emailPromises);
      console.log('News notification emails sent');
    } catch (error) {
      console.error('Error sending news notification:', error);
    }
  },

  // Получить непрочитанные новости для пользователя
  async getUnreadNews(req, res) {
    try {
      const userId = req.user.id;

      const unreadNews = await News.findAll({
        where: {
          status: 'published',
          id: {
            [Op.notIn]: await NewsReadStatus.findAll({
              where: { userId },
              attributes: ['newsId']
            }).then(readStatuses => readStatuses.map(rs => rs.newsId))
          }
        },
        order: [['publishedAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'excerpt', 'publishedAt', 'priority']
      });

      res.json(unreadNews);
    } catch (error) {
      console.error('Error getting unread news:', error);
      res.status(500).json({ error: 'Ошибка получения непрочитанных новостей' });
    }
  },

  // Отметить новость как прочитанную
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({ error: 'Новость не найдена' });
      }

      await NewsReadStatus.findOrCreate({
        where: {
          newsId: id,
          userId: userId
        },
        defaults: {
          newsId: id,
          userId: userId,
          readAt: new Date()
        }
      });

      res.json({ message: 'Новость отмечена как прочитанная' });
    } catch (error) {
      console.error('Error marking news as read:', error);
      res.status(500).json({ error: 'Ошибка отметки новости как прочитанной' });
    }
  },

  // Загрузить изображение для новости
  async uploadNewsImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не найден' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading news image:', error);
      res.status(500).json({ error: 'Ошибка загрузки изображения' });
    }
  },

  // Получить статистику новостей
  async getNewsStats(req, res) {
    try {
      const totalNews = await News.count();
      const publishedNews = await News.count({ where: { status: 'published' } });
      const draftNews = await News.count({ where: { status: 'draft' } });
      const archivedNews = await News.count({ where: { status: 'archived' } });

      const totalReads = await NewsReadStatus.count();
      const uniqueReaders = await NewsReadStatus.count({
        distinct: true,
        col: 'userId'
      });

      res.json({
        totalNews,
        publishedNews,
        draftNews,
        archivedNews,
        totalReads,
        uniqueReaders
      });
    } catch (error) {
      console.error('Error getting news stats:', error);
      res.status(500).json({ error: 'Ошибка получения статистики новостей' });
    }
  }
};

module.exports = newsController;