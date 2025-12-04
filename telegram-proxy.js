const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Вставьте ваши данные Telegram бота
const TELEGRAM_BOT_TOKEN = '8443660805:AAGxVeBmRBxGsXtlNTKgvwqFdFbboOOG5_Y';
const TELEGRAM_CHAT_ID = '596789512';

// Middleware
app.use(cors());
app.use(express.json());

// Маршрут для отправки данных в Telegram
app.post('/api/send-to-telegram', async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ 
                success: false, 
                error: 'Имя и телефон обязательны' 
            });
        }

        const message = `📋 НОВАЯ ЗАЯВКА НА ЗАМЕР\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

        // Отправка сообщения в Telegram
        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            }
        );

        if (response.data.ok) {
            console.log('Сообщение отправлено в Telegram:', response.data.result);
            res.json({ success: true, message: 'Заявка успешно отправлена!' });
        } else {
            throw new Error('Ошибка Telegram API');
        }
    } catch (error) {
        console.error('Ошибка при отправке в Telegram:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при отправке заявки' 
        });
    }
});

// Проверка работы сервера
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Прокси-сервер работает' });
});

app.listen(PORT, () => {
    console.log(`🚀 Прокси-сервер запущен на порту ${PORT}`);
    console.log(`📞 Телеграм бот настроен для чата: ${TELEGRAM_CHAT_ID}`);
});