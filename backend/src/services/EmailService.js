const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.provider = process.env.EMAIL_PROVIDER || 'console';
    this.initTransporter();
  }

  async initTransporter() {
    console.log(`📧 Инициализация Email провайдера: ${this.provider.toUpperCase()}`);
    
    try {
      switch (this.provider) {
        case 'console':
          this.initConsoleTransporter();
          break;
        case 'gmail':
          await this.initGmailTransporter();
          break;
        case 'mailtrap':
          await this.initMailtrapTransporter();
          break;
        case 'sendgrid':
          await this.initSendGridTransporter();
          break;
        default:
          console.warn(`⚠️ Неизвестный провайдер ${this.provider}, используем console`);
          this.initConsoleTransporter();
      }

      // Проверяем соединение для реальных провайдеров
      if (this.provider !== 'console' && this.transporter.verify) {
        await this.testConnection();
      }

    } catch (error) {
      console.error(`❌ Ошибка инициализации ${this.provider}:`, error.message);
      console.log('📧 Переключаемся на консольный режим');
      this.initConsoleTransporter();
    }
  }

  initConsoleTransporter() {
    console.log('📧 Консольный транспорт активирован (для разработки)');
    this.transporter = {
      sendMail: async (options) => {
        console.log('\n📧 ======================');
        console.log('📧 СИМУЛЯЦИЯ ОТПРАВКИ EMAIL');
        console.log('📧 ======================');
        console.log('📧 To:', options.to);
        console.log('📧 Subject:', options.subject);
        console.log('📧 Text:');
        console.log(options.text);
        console.log('📧 ======================\n');
        
        return {
          messageId: 'console-' + Date.now(),
          to: options.to,
          subject: options.subject
        };
      },
      verify: async () => true
    };
  }

  async initGmailTransporter() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      throw new Error('Gmail credentials не настроены. Установите GMAIL_USER и GMAIL_PASS');
    }

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS // App Password
      },
      secure: true,
      timeout: parseInt(process.env.EMAIL_TIMEOUT) || 10000
    });

    console.log('📧 Gmail SMTP транспорт настроен');
  }

  async initMailtrapTransporter() {
    if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      throw new Error('Mailtrap credentials не настроены. Установите MAILTRAP_USER и MAILTRAP_PASS');
    }

    this.transporter = nodemailer.createTransporter({
      host: process.env.MAILTRAP_HOST || 'live.smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_PORT) || 587,
      secure: process.env.EMAIL_SECURE !== 'false', // true для 465, false для других портов
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      },
      timeout: parseInt(process.env.EMAIL_TIMEOUT) || 10000
    });

    console.log('📧 Mailtrap SMTP транспорт настроен');
  }

  async initSendGridTransporter() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key не настроен. Установите SENDGRID_API_KEY');
    }

    // SendGrid через nodemailer
    this.transporter = nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      },
      timeout: parseInt(process.env.EMAIL_TIMEOUT) || 10000
    });

    console.log('📧 SendGrid SMTP транспорт настроен');
  }

  generateVerificationEmailHTML(verificationCode, userName = 'пользователь') {
    return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Подтверждение email - Wekey Tools</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
            }
            
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
                padding: 40px 30px;
                text-align: center;
            }
            
            .logo {
                color: white;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .header-subtitle {
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 20px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 20px;
            }
            
            .message {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .code-container {
                background: #f7fafc;
                border: 2px dashed #e2e8f0;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }
            
            .code-label {
                font-size: 14px;
                color: #718096;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            .verification-code {
                font-size: 36px;
                font-weight: bold;
                color: #5E35F2;
                letter-spacing: 4px;
                font-family: 'Courier New', monospace;
            }
            
            .code-note {
                font-size: 14px;
                color: #a0aec0;
                margin-top: 15px;
            }
            
            .warning {
                background: #fef5e7;
                border-left: 4px solid #f6ad55;
                padding: 20px;
                margin: 30px 0;
                border-radius: 0 8px 8px 0;
            }
            
            .warning-text {
                font-size: 14px;
                color: #744210;
                margin: 0;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer-text {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 15px;
            }
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #6c757d;
                text-decoration: none;
                font-size: 14px;
            }
            
            .social-links a:hover {
                color: #5E35F2;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .header {
                    padding: 30px 20px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .verification-code {
                    font-size: 28px;
                    letter-spacing: 3px;
                }
                
                .footer {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">Wekey Tools</div>
                <div class="header-subtitle">Инструменты для SEO и веб-мастеров</div>
            </div>
            
            <div class="content">
                <div class="greeting">Добро пожаловать, ${userName}! 👋</div>
                
                <div class="message">
                    Спасибо за регистрацию в Wekey Tools! Для завершения создания аккаунта подтвердите ваш email адрес, используя код ниже:
                </div>
                
                <div class="code-container">
                    <div class="code-label">Код подтверждения</div>
                    <div class="verification-code">${verificationCode}</div>
                    <div class="code-note">Введите этот код на странице подтверждения</div>
                </div>
                
                <div class="message">
                    После подтверждения email вы получите <strong>100 бонусных коинов</strong> для использования наших инструментов! 🎉
                </div>
                
                <div class="warning">
                    <p class="warning-text">
                        <strong>Важно:</strong> Код действителен в течение 15 минут. Если вы не регистрировались на Wekey Tools, просто проигнорируйте это письмо.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text">
                    С уважением,<br>
                    Команда Wekey Tools
                </div>
                
                <div class="social-links">
                    <a href="mailto:support@wekeytools.com">Поддержка</a>
                    <a href="#">Политика конфиденциальности</a>
                    <a href="#">Отписаться</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendVerificationEmail(email, verificationCode, userName) {
    try {
      const htmlContent = this.generateVerificationEmailHTML(verificationCode, userName);
      
      const mailOptions = {
        from: {
          name: 'Wekey Tools',
          address: process.env.EMAIL_FROM || 'noreply@wekeytools.com'
        },
        to: email,
        subject: `Подтверждение email - Код: ${verificationCode}`,
        html: htmlContent,
        text: `
Добро пожаловать в Wekey Tools!

Ваш код подтверждения: ${verificationCode}

Введите этот код на странице подтверждения для завершения регистрации.
Код действителен в течение 15 минут.

После подтверждения вы получите 100 бонусных коинов!

С уважением,
Команда Wekey Tools
        `.trim()
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', {
        messageId: result.messageId,
        to: email,
        subject: mailOptions.subject
      });
      
      return {
        success: true,
        messageId: result.messageId
      };
      
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection successful');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();