// EmailService уже экспортируется как экземпляр
const emailService = require('../services/EmailService');

/**
 * Универсальная функция для отправки email
 * @param {string} to - Email получателя
 * @param {string} subject - Тема письма
 * @param {string} html - HTML содержимое письма
 * @param {string} text - Текстовое содержимое письма (опционально)
 * @param {object} options - Дополнительные опции для письма
 * @returns {Promise<object>} Результат отправки
 */
async function sendEmail(to, subject, html, text = null, options = {}) {
  try {
    // Подготавливаем опции для отправки
    const mailOptions = {
      from: {
        name: options.fromName || 'Wekey Tools',
        address: options.fromEmail || process.env.EMAIL_FROM || 'noreply@wekeytools.com'
      },
      to: to,
      subject: subject,
      html: html,
      ...options // Дополнительные опции (attachments, cc, bcc и т.д.)
    };

    // Добавляем текстовую версию, если не предоставлена
    if (text) {
      mailOptions.text = text;
    } else {
      // Простое преобразование HTML в текст (удаляем теги)
      mailOptions.text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // Отправляем письмо через EmailService
    const result = await emailService.transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      messageId: result.messageId,
      to: to,
      subject: subject
    });
    
    return {
      success: true,
      messageId: result.messageId,
      info: result
    };
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Отправка письма с подтверждением email (использует готовый метод)
 * @param {string} email - Email получателя
 * @param {string} verificationCode - Код подтверждения
 * @param {string} userName - Имя пользователя
 * @returns {Promise<object>} Результат отправки
 */
async function sendVerificationEmail(email, verificationCode, userName) {
  return await emailService.sendVerificationEmail(email, verificationCode, userName);
}

/**
 * Массовая отправка писем
 * @param {Array} recipients - Массив получателей {email, name}
 * @param {string} subject - Тема письма
 * @param {string} html - HTML содержимое
 * @param {string} text - Текстовое содержимое (опционально)
 * @param {object} options - Дополнительные опции
 * @returns {Promise<object>} Результат массовой отправки
 */
async function sendBulkEmail(recipients, subject, html, text = null, options = {}) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  console.log(`📧 Starting bulk email send to ${recipients.length} recipients`);

  // Отправляем письма последовательно, чтобы не перегрузить SMTP сервер
  for (const recipient of recipients) {
    try {
      const recipientEmail = typeof recipient === 'string' ? recipient : recipient.email;
      const recipientName = typeof recipient === 'object' ? recipient.name : null;

      // Персонализируем содержимое, если есть имя
      let personalizedHtml = html;
      let personalizedText = text;
      
      if (recipientName) {
        personalizedHtml = html.replace(/\{\{name\}\}/g, recipientName);
        if (personalizedText) {
          personalizedText = personalizedText.replace(/\{\{name\}\}/g, recipientName);
        }
      }

      const result = await sendEmail(
        recipientEmail, 
        subject, 
        personalizedHtml, 
        personalizedText, 
        options
      );

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          email: recipientEmail,
          error: result.error
        });
      }

      // Небольшая задержка между отправками
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      results.failed++;
      results.errors.push({
        email: typeof recipient === 'string' ? recipient : recipient.email,
        error: error.message
      });
    }
  }

  console.log(`📧 Bulk email completed: ${results.success} success, ${results.failed} failed`);
  return results;
}

/**
 * Проверка соединения с email сервисом
 * @returns {Promise<boolean>} Статус соединения
 */
async function testEmailConnection() {
  return await emailService.testConnection();
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendBulkEmail,
  testEmailConnection,
  emailService
};