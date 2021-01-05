const TelegramBot = require('node-telegram-bot-api');

const { HOST, PORT, TOKEN } = process.env;

const bot = new TelegramBot(TOKEN, {
  webHook: {
    port: Number(PORT),
  },
});

bot.setWebHook(`${HOST}/bot${TOKEN}`);

module.exports = bot;
