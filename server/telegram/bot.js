const TelegramBot = require('node-telegram-bot-api');
const db = require('../database');

const token = process.env.TELEGRAM_BOT_TOKEN;
const isPlaceholder = !token || token.includes('YOUR_TELEGRAM_BOT_TOKEN');

if (isPlaceholder) {
    console.log('TELEGRAM_BOT_TOKEN not provided or is placeholder. Bot functionality disabled.');
}

const bot = !isPlaceholder ? new TelegramBot(token, { polling: true }) : null;

const states = {};

if (bot) {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        states[chatId] = { step: 'first_name' };
        bot.sendMessage(chatId, "Welcome! Let's register you. What is your first name?");
    });

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!states[chatId] || text === '/start') return;

        const state = states[chatId];

        switch (state.step) {
            case 'first_name':
                state.first_name = text;
                state.step = 'last_name';
                bot.sendMessage(chatId, `Nice to meet you, ${text}! Now, what is your last name?`);
                break;

            case 'last_name':
                state.last_name = text;
                state.step = 'dob';
                bot.sendMessage(chatId, "Great! What is your date of birth? (Please use YYYY-MM-DD format)");
                break;

            case 'dob':
                if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                    bot.sendMessage(chatId, "Invalid format. Please use YYYY-MM-DD (e.g., 1990-05-15)");
                    return;
                }
                state.date_of_birth = text;
                state.step = 'phone';
                bot.sendMessage(chatId, "Almost done! What is your phone number?");
                break;

            case 'phone':
                state.phone_number = text;
                try {
                    const stmt = db.prepare(`
            INSERT INTO clients (first_name, last_name, date_of_birth, phone_number, telegram_chat_id)
            VALUES (?, ?, ?, ?, ?)
          `);
                    stmt.run(state.first_name, state.last_name, state.date_of_birth, state.phone_number, chatId.toString());
                    bot.sendMessage(chatId, "Registration complete! 🎉 We'll notify you on your birthday!");
                    delete states[chatId];
                } catch (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        bot.sendMessage(chatId, "A user with this phone number already exists.");
                    } else {
                        bot.sendMessage(chatId, "An error occurred. Please try again with /start.");
                    }
                    delete states[chatId];
                }
                break;
        }
    });
}

module.exports = bot;
