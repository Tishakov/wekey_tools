const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG, JPG, PNG, GIF, WebP)'));
    }
  }
});

// Публичные маршруты (доступны всем пользователям)
router.get('/public', newsController.getAllNews);
router.get('/public/:id', newsController.getNews);

// Маршруты для авторизованных пользователей
router.use(authenticateToken);

// Получить непрочитанные новости для пользователя
router.get('/unread', newsController.getUnreadNews);

// Отметить новость как прочитанную
router.post('/:id/read', newsController.markAsRead);

// Админские маршруты
router.use(requireAdmin);

// Получить все новости (админ)
router.get('/', newsController.getAllNews);

// Создать новость
router.post('/', newsController.createNews);

// Получить конкретную новость (админ)
router.get('/:id', newsController.getNews);

// Обновить новость
router.put('/:id', newsController.updateNews);

// Удалить новость
router.delete('/:id', newsController.deleteNews);

// Опубликовать новость
router.post('/:id/publish', newsController.publishNews);

// Архивировать новость
router.post('/:id/archive', newsController.archiveNews);

// Загрузить изображение для новости
router.post('/upload/image', upload.single('image'), newsController.uploadNewsImage);

// Получить статистику новостей
router.get('/stats/overview', newsController.getNewsStats);

module.exports = router;