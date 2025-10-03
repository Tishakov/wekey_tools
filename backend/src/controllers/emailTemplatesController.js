const db = require('../config/database');
const EmailTemplate = db.EmailTemplate;

// Получить все шаблоны (с фильтрацией)
exports.getTemplates = async (req, res) => {
  try {
    const { category, isPublished, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';
    
    const templates = await EmailTemplate.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении шаблонов',
      error: error.message
    });
  }
};

// Получить один шаблон по ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Шаблон не найден'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении шаблона',
      error: error.message
    });
  }
};

// Создать новый шаблон
exports.createTemplate = async (req, res) => {
  try {
    const { name, description, templateData, htmlOutput, category, isPublished } = req.body;
    
    if (!name || !templateData) {
      return res.status(400).json({
        success: false,
        message: 'Название и данные шаблона обязательны'
      });
    }

    const template = await EmailTemplate.create({
      name,
      description,
      templateData,
      htmlOutput,
      category: category || 'general',
      isPublished: isPublished || false,
      createdBy: req.user?.id || null
    });

    res.status(201).json({
      success: true,
      message: 'Шаблон успешно создан',
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании шаблона',
      error: error.message
    });
  }
};

// Обновить шаблон
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, templateData, htmlOutput, category, isPublished } = req.body;
    
    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Шаблон не найден'
      });
    }

    await template.update({
      name: name !== undefined ? name : template.name,
      description: description !== undefined ? description : template.description,
      templateData: templateData !== undefined ? templateData : template.templateData,
      htmlOutput: htmlOutput !== undefined ? htmlOutput : template.htmlOutput,
      category: category !== undefined ? category : template.category,
      isPublished: isPublished !== undefined ? isPublished : template.isPublished
    });

    res.json({
      success: true,
      message: 'Шаблон успешно обновлён',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении шаблона',
      error: error.message
    });
  }
};

// Удалить шаблон
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await EmailTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Шаблон не найден'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: 'Шаблон успешно удалён'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении шаблона',
      error: error.message
    });
  }
};

// Дублировать шаблон
exports.duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const original = await EmailTemplate.findByPk(id);
    
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Шаблон не найден'
      });
    }

    const duplicate = await EmailTemplate.create({
      name: `${original.name} (копия)`,
      description: original.description,
      templateData: original.templateData,
      htmlOutput: original.htmlOutput,
      category: original.category,
      isPublished: false,
      createdBy: req.user?.id || null
    });

    res.status(201).json({
      success: true,
      message: 'Шаблон успешно дублирован',
      data: duplicate
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при дублировании шаблона',
      error: error.message
    });
  }
};
