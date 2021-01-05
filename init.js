const TelegramBot = require('node-telegram-bot-api');

const { host } = require('./util');

const { PORT, TOKEN } = process.env;

const bot = new TelegramBot(TOKEN, {
  webHook: {
    port: Number(PORT),
  },
});

(async () => {
  bot.setWebHook(`${host}/bot${TOKEN}`);
})();

module.exports = bot;
