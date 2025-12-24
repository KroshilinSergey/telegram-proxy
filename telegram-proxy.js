const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Log environment variables (без показа значений для безопасности)
console.log('🔧 Environment variables loaded:');
console.log('   TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? '✓ Present' : '✗ Missing');
console.log('   TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? '✓ Present' : '✗ Missing');

// Check if variables are set
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ ERROR: Missing Telegram environment variables');
  console.error('   Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Render environment variables');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Telegram Proxy API v2.0',
    endpoint: '/api/send-to-telegram',
    time: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    telegram: TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'
  });
});

// Main endpoint
app.post('/api/send-to-telegram', async (req, res) => {
  try {
    console.log('📥 Received POST request to /api/send-to-telegram');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, phone, services, timestamp, fullMessage } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and phone'
      });
    }
    
    // Prepare message for Telegram
    const telegramMessage = `
🆕 НОВАЯ ЗАЯВКА С САЙТА

👤 *Имя:* ${name}
📞 *Телефон:* ${phone}
🛠 *Услуги:* ${services || 'Не указаны'}
⏰ *Время:* ${timestamp || new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })}

_Заявка отправлена через веб-форму_
    `;
    
    console.log('📤 Sending to Telegram...');
    
    // Send to Telegram
    await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      parse_mode: 'Markdown'
    });
    
    console.log('✅ Message sent to Telegram successfully');
    
    res.json({ 
      success: true,
      message: 'Заявка успешно отправлена в Telegram'
    });
    
  } catch (error) {
    console.error('❌ Error sending to Telegram:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to send message to Telegram bot'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access at: https://telegram-proxy-xumy.onrender.com`);
  console.log(`✅ Endpoint: POST https://telegram-proxy-xumy.onrender.com/api/send-to-telegram`);
  console.log(`🔄 Health check: GET https://telegram-proxy-xumy.onrender.com/health`);
});
