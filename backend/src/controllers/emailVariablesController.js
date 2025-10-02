const { EmailVariable } = require('../config/database');
const { Op } = require('sequelize');

const emailVariablesController = {
  // Получить все переменные
  async getAllVariables(req, res) {
    try {
      const { category } = req.query;

      const where = {};
      if (category && category !== 'all') {
        where.category = category;
      }

      const variables = await EmailVariable.findAll({
        where,
        order: [
          ['category', 'ASC'],
          ['key', 'ASC']
        ]
      });

      // Группируем по категориям
      const grouped = variables.reduce((acc, variable) => {
        const cat = variable.category;
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push({
          id: variable.id,
          key: variable.key,
          description: variable.description,
          example: variable.example,
          category: variable.category
        });
        return acc;
      }, {});

      res.json({
        success: true,
        variables: variables.map(v => ({
          id: v.id,
          key: v.key,
          description: v.description,
          example: v.example,
          category: v.category
        })),
        grouped
      });
    } catch (error) {
      console.error('Error fetching email variables:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении переменных'
      });
    }
  },

  // Получить одну переменную
  async getVariable(req, res) {
    try {
      const { id } = req.params;
      
      const variable = await EmailVariable.findByPk(id);
      
      if (!variable) {
        return res.status(404).json({
          success: false,
          error: 'Переменная не найдена'
        });
      }

      res.json({
        success: true,
        variable: {
          id: variable.id,
          key: variable.key,
          description: variable.description,
          example: variable.example,
          category: variable.category
        }
      });
    } catch (error) {
      console.error('Error fetching variable:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении переменной'
      });
    }
  },

  // Создать новую переменную (для кастомных)
  async createVariable(req, res) {
    try {
      const { key, description, example, category = 'custom' } = req.body;

      // Валидация
      if (!key || !description) {
        return res.status(400).json({
          success: false,
          error: 'Укажите ключ и описание переменной'
        });
      }

      // Проверка на дубликаты
      const existing = await EmailVariable.findOne({ where: { key } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Переменная с таким ключом уже существует'
        });
      }

      const variable = await EmailVariable.create({
        key,
        description,
        example,
        category
      });

      res.status(201).json({
        success: true,
        message: 'Переменная создана',
        variable: {
          id: variable.id,
          key: variable.key,
          description: variable.description,
          example: variable.example,
          category: variable.category
        }
      });
    } catch (error) {
      console.error('Error creating variable:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании переменной'
      });
    }
  },

  // Обновить переменную
  async updateVariable(req, res) {
    try {
      const { id } = req.params;
      const { description, example } = req.body;

      const variable = await EmailVariable.findByPk(id);
      
      if (!variable) {
        return res.status(404).json({
          success: false,
          error: 'Переменная не найдена'
        });
      }

      // Системные переменные можно только редактировать description и example
      if (variable.category !== 'custom' && req.body.key) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя изменить ключ системной переменной'
        });
      }

      await variable.update({
        description: description || variable.description,
        example: example || variable.example
      });

      res.json({
        success: true,
        message: 'Переменная обновлена',
        variable: {
          id: variable.id,
          key: variable.key,
          description: variable.description,
          example: variable.example,
          category: variable.category
        }
      });
    } catch (error) {
      console.error('Error updating variable:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении переменной'
      });
    }
  },

  // Удалить переменную (только custom)
  async deleteVariable(req, res) {
    try {
      const { id } = req.params;

      const variable = await EmailVariable.findByPk(id);
      
      if (!variable) {
        return res.status(404).json({
          success: false,
          error: 'Переменная не найдена'
        });
      }

      if (variable.category !== 'custom') {
        return res.status(400).json({
          success: false,
          error: 'Нельзя удалить системную переменную'
        });
      }

      await variable.destroy();

      res.json({
        success: true,
        message: 'Переменная удалена'
      });
    } catch (error) {
      console.error('Error deleting variable:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении переменной'
      });
    }
  },

  // Парсить переменные из текста
  parseVariables(text) {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        variable: match[1],
        fullMatch: match[0],
        index: match.index
      });
    }

    return matches;
  },

  // Заменить переменные на значения
  async replaceVariables(text, userData = {}) {
    try {
      // Получаем все переменные из текста
      const parsedVars = this.parseVariables(text);
      
      if (parsedVars.length === 0) {
        return text;
      }

      // Получаем переменные из БД
      const variableKeys = parsedVars.map(v => v.variable);
      const variables = await EmailVariable.findAll({
        where: {
          key: {
            [Op.in]: variableKeys
          }
        }
      });

      // Создаем map переменных
      const variableMap = {};
      variables.forEach(v => {
        variableMap[v.key] = v;
      });

      // Заменяем переменные
      let result = text;
      
      parsedVars.forEach(parsed => {
        const varKey = parsed.variable;
        const variable = variableMap[varKey];
        
        if (variable) {
          let value = '';
          
          // Получаем значение из userData или используем example
          switch (variable.category) {
            case 'user':
              value = userData[varKey] || variable.example || `{{${varKey}}}`;
              break;
            case 'system':
              value = this.getSystemVariable(varKey);
              break;
            case 'custom':
              value = userData[varKey] || variable.example || `{{${varKey}}}`;
              break;
          }
          
          result = result.replace(parsed.fullMatch, value);
        }
      });

      return result;
    } catch (error) {
      console.error('Error replacing variables:', error);
      return text;
    }
  },

  // Получить значения системных переменных
  getSystemVariable(key) {
    const systemVars = {
      platformName: 'Wekey Tools',
      supportEmail: 'support@wekey.tools',
      currentYear: new Date().getFullYear().toString(),
      currentDate: new Date().toLocaleDateString('ru-RU'),
      siteUrl: process.env.FRONTEND_URL || 'https://wekey.tools'
    };

    return systemVars[key] || `{{${key}}}`;
  }
};

module.exports = emailVariablesController;
