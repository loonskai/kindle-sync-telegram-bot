require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');

const { HOST, PORT, TOKEN } = process.env;

const bot = new TelegramBot(TOKEN, {
  webHook: {
    port: Number(PORT),
  },
});

bot.setWebHook(`${HOST}/bot${TOKEN}`);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Configure', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Configure',
            callback_data: 'configure',
          },
        ],
      ],
    },
  });
});

bot.on('callback_query', (query) => {
  const { id: callbackQueryId, data, message } = query;
  switch (data) {
    case 'configure':
      bot.sendMessage(message.chat.id, 'Select configuration', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Set Kindle email',
                callback_data: 'set_kindle_email',
              },
            ],
          ],
        },
      });
      bot.answerCallbackQuery(callbackQueryId);
      break;
    case 'set_kindle_email':
      bot.sendMessage(message.chat.id, 'Enter your Kindle email', {
        reply_markup: {
          force_reply: true,
        },
      });
      bot.answerCallbackQuery(callbackQueryId);
      break;
    default:
      bot.sendMessage(message.chat.id, 'Unknown operation');
      bot.onReplyToMessage(message.chat.id);
      bot.answerCallbackQuery(callbackQueryId);
      break;
  }
});

bot.onText(/\/info/, async (msg) => {
  const { id: chatId } = msg.chat;
  const { id: userId } = await bot.getChat(chatId);

  const { email } = await db.getKindleUser({ id: userId });
  bot.sendMessage(chatId, `Your kindle email is ${email}`);
});

bot.on('message', async (msg) => {
  const { reply_to_message: replyToMessage, text, chat: { id: chatId } } = msg;

  if (replyToMessage) {
    const { text: replyText, from } = replyToMessage;

    if (from.is_bot && replyText === 'Enter your Kindle email') {
      const { id } = await bot.getChat(chatId);
      await db.saveKindleEmail({ id, email: text });
    }
  }
});

bot.on('document', (msg) => {
  const { chat, document } = msg;

  bot.sendMessage(chat.id, 'Converting your book to .mobi...');
  const fileTitle = document.file_name.match(/(.*).epub$/)[1];

  const fileStream = bot.getFileStream(document.file_id);
  const tempPath = path.join(os.tmpdir(), document.file_name);
  const convertedFilename = `${fileTitle}.mobi`;
  const tempOutputPath = path.join(os.tmpdir(), convertedFilename);

  const writeStream = fs.createWriteStream(tempPath, { flags: 'w' });
  fileStream.pipe(writeStream);

  writeStream.on('close', () => {
    const child = spawn('ebook-convert', [tempPath, tempOutputPath]);
    child.stdout.on('close', () => {
      bot.sendDocument(chat.id, tempOutputPath, {}, {
        filename: convertedFilename,
        contentType: 'application/x-mobipocket-ebook',
      });
    });
  });
});
