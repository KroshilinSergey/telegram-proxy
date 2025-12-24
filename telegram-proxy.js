const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Проверка наличия переменных окружения
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ ERROR: Missing Telegram environment variables');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Telegram Proxy API',
    time: new Date().toISOString(),
    port: PORT
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main endpoint
app.post('/api/send-to-telegram', async (req, res) => {
  try {
    console.log('📥 Received data:', req.body);
    
    const { name, phone, services, timestamp, fullMessage } = req.body;
    
    // Проверяем обязательные поля
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and phone'
      });
    }
    
    // Создаем сообщение для Telegram
    const message = `
🆕 НОВАЯ ЗАЯВКА

👤 Имя: ${name}
📱 Телефон: ${phone}
🔧 Услуги: ${services || 'Не выбрано'}
⏰ Время (Самара): ${timestamp || new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })}
    `;
    
    console.log('📤 Sending to Telegram:', message);
    
    // Отправляем в Telegram
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
    
    res.json({ 
      success: true,
      message: 'Заявка отправлена'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Telegram bot configured`);
});
