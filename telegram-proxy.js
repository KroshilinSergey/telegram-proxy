const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки
app.use(cors());
app.use(bodyParser.json());

// Конфигурация Telegram бота
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'ваш_токен_бота';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'ваш_chat_id';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Функция для отправки сообщения в Telegram
async function sendToTelegram(data) {
  try {
    // Формируем красивое сообщение
    const message = `
📋 *НОВАЯ ЗАЯВКА С САЙТА*

👤 *Имя:* ${data.name}
📞 *Телефон:* \`${data.phone}\`
🛠 *Выбранные услуги:* ${data.services}
⏰ *Время отправки (Самара):* ${data.timestamp}

💬 *Полное сообщение:*
${data.fullMessage || 'Нет дополнительной информации'}

_IP: ${data.ip || 'неизвестно'}_
_User Agent: ${data.userAgent || 'неизвестно'}_
    `;

    // Отправляем сообщение
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    return true;
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    throw error;
  }
}

// Главный маршрут
app.get('/', (req, res) => {
  res.json({
    service: 'Telegram Proxy API',
    version: '2.0',
    status: 'running',
    endpoints: {
      send: 'POST /api/send-to-telegram'
    }
  });
});

// Маршрут для отправки в Telegram
app.post('/api/send-to-telegram', async (req, res) => {
  try {
    console.log('Получены данные:', req.body);

    // Получаем данные из запроса
    const { name, phone, services, timestamp, fullMessage } = req.body;
    
    // Добавляем дополнительную информацию
    const data = {
      name: name || 'Не указано',
      phone: phone || 'Не указано',
      services: services || 'Не выбраны',
      timestamp: timestamp || new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' }),
      fullMessage: fullMessage || '',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    // Валидация обязательных полей
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля: name и phone'
      });
    }

    // Отправляем в Telegram
    await sendToTelegram(data);

    // Логируем успешную отправку
    console.log('Заявка успешно отправлена:', {
      name: data.name,
      phone: data.phone,
      services: data.services,
      timestamp: data.timestamp
    });

    // Отправляем успешный ответ
    res.json({
      success: true,
      message: 'Заявка успешно отправлена в Telegram',
      data: {
        name: data.name,
        phone: data.phone,
        services: data.services,
        timestamp: data.timestamp
      }
    });

  } catch (error) {
    console.error('Ошибка обработки заявки:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Маршрут для проверки здоровья
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Telegram Bot готов к приему сообщений`);
});
