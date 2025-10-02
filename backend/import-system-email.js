/**
 * Script: Import system welcome email from EmailService to database
 * 
 * Purpose: Extract hardcoded welcome email template and save as system newsletter
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Import existing Newsletter model
const NewsletterModel = require('./src/models/Newsletter');
const Newsletter = NewsletterModel(sequelize);

// Welcome email HTML template (extracted from EmailService.js)
const welcomeEmailHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение Email - Wekey Tools</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 10px;
        }
        
        .tagline {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #666666;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        
        .code-container {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        
        .code-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 15px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .verification-code {
            font-size: 36px;
            font-weight: 800;
            color: #5E35F2;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .bonus-info {
            background: linear-gradient(135deg, #FFD89B 0%, #19547B 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            text-align: center;
        }
        
        .bonus-amount {
            font-size: 28px;
            font-weight: 800;
            margin: 10px 0;
        }
        
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 25px 0;
            border-radius: 5px;
        }
        
        .warning-text {
            font-size: 14px;
            color: #856404;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer-text {
            font-size: 13px;
            color: #6c757d;
            margin-bottom: 15px;
        }
        
        .footer-links {
            margin-top: 20px;
        }
        
        .footer-link {
            color: #5E35F2;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #dee2e6, transparent);
            margin: 30px 0;
        }
        
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            
            .email-container {
                border-radius: 10px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .logo {
                font-size: 26px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .verification-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
            
            .bonus-amount {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Wekey Tools</div>
            <div class="tagline">Ваш надежный помощник для работы с ключами и сертификатами</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Добро пожаловать, {{firstName}}! 👋
            </div>
            
            <div class="message">
                Спасибо за регистрацию в Wekey Tools! Чтобы завершить создание вашего аккаунта и начать пользоваться всеми возможностями платформы, пожалуйста, подтвердите ваш email адрес.
            </div>
            
            <div class="code-container">
                <div class="code-label">Ваш код подтверждения</div>
                <div class="verification-code">{{verificationCode}}</div>
            </div>
            
            <div class="message">
                Просто введите этот код на странице подтверждения, и ваш аккаунт будет активирован.
            </div>
            
            <div class="bonus-info">
                <div>🎉 Бонус за регистрацию!</div>
                <div class="bonus-amount">{{balance}} коинов</div>
                <div>После подтверждения вы получите бонусные коины для начала работы!</div>
            </div>
            
            <div class="warning">
                <div class="warning-text">
                    ⚠️ <strong>Важно:</strong> Код действителен в течение 15 минут. Если вы не подтверждали регистрацию, просто проигнорируйте это письмо.
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="message" style="font-size: 14px; color: #999;">
                Если у вас возникли вопросы или проблемы, наша команда поддержки всегда готова помочь!
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © {{currentYear}} Wekey Tools. Все права защищены.
            </div>
            <div class="footer-links">
                <a href="{{siteUrl}}/support" class="footer-link">Поддержка</a>
                <a href="{{siteUrl}}/privacy" class="footer-link">Конфиденциальность</a>
                <a href="{{siteUrl}}/terms" class="footer-link">Условия использования</a>
            </div>
            <div class="footer-text" style="margin-top: 15px;">
                Получили это письмо по ошибке? <a href="{{siteUrl}}/unsubscribe" class="footer-link">Отписаться</a>
            </div>
        </div>
    </div>
</body>
</html>`;

async function importSystemEmail() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Find first admin user
    const [admins] = await sequelize.query("SELECT id FROM Users WHERE role = 'admin' LIMIT 1;");
    const adminId = admins[0]?.id || 1;
    console.log(`👤 Using admin ID: ${adminId}`);

    // Check if system welcome email already exists
    const existingEmail = await Newsletter.findOne({
      where: {
        type: 'system_welcome',
        isSystem: true
      }
    });

    if (existingEmail) {
      console.log('⚠️  System welcome email already exists. Updating...');
      
      await existingEmail.update({
        title: '🎉 Добро пожаловать в Wekey Tools',
        subject: 'Подтвердите ваш Email - Wekey Tools',
        content: welcomeEmailHTML,
        status: 'active'
      });
      
      console.log('✅ System welcome email updated');
    } else {
      console.log('📧 Creating system welcome email...');
      
      await Newsletter.create({
        title: '🎉 Добро пожаловать в Wekey Tools',
        subject: 'Подтвердите ваш Email - Wekey Tools',
        content: welcomeEmailHTML,
        status: 'active',
        type: 'system_welcome',
        isSystem: true,
        sentCount: 0,
        createdBy: adminId, // Admin user
        targetAudience: 'all',
        totalRecipients: 0,
        failedCount: 0
      });
      
      console.log('✅ System welcome email created');
    }

    console.log('\n📊 Current system emails:');
    const systemEmails = await Newsletter.findAll({
      where: { isSystem: true },
      attributes: ['id', 'title', 'type', 'status']
    });
    
    console.table(systemEmails.map(e => ({
      ID: e.id,
      Title: e.title,
      Type: e.type,
      Status: e.status
    })));

    console.log('\n✅ Import completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run import
importSystemEmail();
