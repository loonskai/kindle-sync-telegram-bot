require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN, {
  polling: true,
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const { id: chatId } = msg.chat;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
  const { id: chatId } = msg.chat;

  bot.sendMessage(chatId, 'whatever you say mate');
});
