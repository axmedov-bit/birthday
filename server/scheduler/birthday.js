const cron = require('node-cron');
const db = require('../database');
const bot = require('../telegram/bot');

function checkBirthdays() {
    console.log('Running daily birthday check...');
    const clients = db.prepare('SELECT * FROM clients').all();
    const today = new Date();

    clients.forEach(client => {
        if (!client.telegram_chat_id) return;

        const dob = new Date(client.date_of_birth);
        const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

        // Difference in days
        const diffTime = thisYearBday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message = '';

        if (thisYearBday.toDateString() === today.toDateString()) {
            message = `🎉 Happy Birthday, ${client.first_name}! We wish you happiness and success!`;
        } else if (diffDays === 3) {
            message = `🎉 Happy upcoming birthday, ${client.first_name}! Only 3 days left! We wish you happiness and success!`;
        }

        if (message && bot) {
            bot.sendMessage(client.telegram_chat_id, message)
                .then(() => {
                    db.prepare('INSERT INTO notification_logs (client_id, message, status) VALUES (?, ?, ?)')
                        .run(client.id, message, 'success');
                })
                .catch(err => {
                    console.error(`Failed to send to ${client.telegram_chat_id}:`, err);
                    db.prepare('INSERT INTO notification_logs (client_id, message, status) VALUES (?, ?, ?)')
                        .run(client.id, message, 'failed');
                });
        }
    });
}

// Run every day at 09:00
cron.schedule('0 9 * * *', checkBirthdays);

// Also run immediately on start for testing (optional, but good for verification)
// checkBirthdays();

module.exports = checkBirthdays;
