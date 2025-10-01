# 🛠️ Scripts Directory

Эта папка содержит утилитные скрипты для разработки, миграции и тестирования проекта Wekey Tools.

## 📁 Структура папок

### `/migration` - Скрипты миграции и массовых изменений
Скрипты для автоматического внесения изменений в кодовую базу:

- **add-auth-to-functions.js** - добавление аутентификации к функциям
- **add-missing-imports.js** - автоматическое добавление недостающих импортов
- **add-modal-windows.js** / **add-modal-windows-v2.js** - интеграция модальных окон
- **audit_tool_names.js** - аудит названий инструментов
- **auto-fix-remaining-tools.js** - автоматическое исправление инструментов
- **clean_duplicates.js** - очистка дубликатов в БД
- **fix_navigation_mass.js** - массовое исправление навигации
- **fix_tool_ids.js** - исправление ID инструментов
- **fix_tool_names.js** - синхронизация названий инструментов
- **final_tool_id_check.js** - финальная проверка ID
- **final-cleanup-coins.js** - очистка монет системы
- **finalize-coin-integration.js** - финализация интеграции монет
- **mass-add-auth-blocking.js** - массовое добавление блокировки для неавторизованных
- **mass-integrate-coins.js** - массовая интеграция монет

### `/testing` - Тестовые и проверочные скрипты
Скрипты для проверки функциональности и структуры:

#### Проверка БД:
- **check_admins.js** - проверка админов
- **check_db_structure.js** - проверка структуры БД
- **check_table_structure.js** - проверка структуры таблиц
- **check_users_structure.js** - проверка структуры пользователей

#### Проверка инструментов:
- **check-analytics.js** - проверка аналитики
- **check-duplicate-finder.js** - проверка поиска дубликатов
- **check-match-types.js** - проверка типов соответствия
- **check-privacy-policy.js** - проверка генератора политики конфиденциальности
- **check-spaces-to-paragraphs.js** - проверка преобразования пробелов
- **check-text-by-columns.js** - проверка текста по колонкам
- **check-text-sorting.js** - проверка сортировки текста
- **check-text-to-html.js** - проверка конвертации текста в HTML
- **check-transliteration.js** - проверка транслитерации
- **check-word-gluing.js** - проверка склеивания слов
- **check-word-inflection.js** - проверка склонения слов

#### API тестирование:
- **test_admin_login.js** - тест авторизации админа
- **test_api_get_newsletter.js** - тест API получения рассылки
- **test-newsletter-news-api.js** - тест API новостей рассылки
- **test-schema-full.js** - полный тест схемы
- **test-schema-new.js** - тест новой схемы
- **quick-api-test.js** - быстрый API тест

### `/utilities` - Утилитные скрипты
Вспомогательные bash скрипты:

- **fix_missing_braces.sh** - исправление недостающих скобок
- **fix_stats_duplicates.sh** - исправление дубликатов статистики
- **restore-broken-tools.sh** - восстановление сломанных инструментов

## 🚀 Использование

### Запуск скриптов миграции
```bash
# Из корня проекта
node scripts/migration/add-auth-to-functions.js

# Или из папки scripts
cd scripts/migration
node add-auth-to-functions.js
```

### Запуск тестовых скриптов
```bash
# Проверка структуры БД
node scripts/testing/check_db_structure.js

# Тестирование API
node scripts/testing/test_admin_login.js
```

### Запуск bash утилит
```bash
# Исправление дубликатов
bash scripts/utilities/fix_stats_duplicates.sh
```

## ⚠️ Важные замечания

1. **Backup перед миграцией**: Всегда делайте резервную копию БД перед запуском миграционных скриптов
2. **Тестовая среда**: Сначала тестируйте скрипты на dev окружении
3. **Логи**: Многие скрипты создают лог-файлы - проверяйте их после выполнения
4. **Зависимости**: Убедитесь, что backend и БД запущены для API тестов

## 📝 Создание новых скриптов

При создании новых скриптов следуйте правилам:

1. **Именование**:
   - Миграции: `migrate-feature-name.js`
   - Тесты: `test-feature-name.js` или `check-feature-name.js`
   - Утилиты: `fix-issue-name.sh` или `utility-name.js`

2. **Документация**:
   - Добавьте комментарий в начало файла с описанием
   - Укажите зависимости и требования
   - Добавьте примеры использования

3. **Безопасность**:
   - Не храните credentials в скриптах
   - Используйте переменные окружения
   - Логируйте все критические операции

## 🔗 Связанные документы

- [CHANGELOG.md](../CHANGELOG.md) - история изменений проекта
- [DEVELOPMENT_NOTES.md](../DEVELOPMENT_NOTES.md) - заметки разработки
- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) - контекст проекта

---

**Последнее обновление**: 01.10.2025
