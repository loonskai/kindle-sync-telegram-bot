require('dotenv').config();

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const {
  HOST,
  PORT,
  TOKEN,
} = process.env;

const bot = new TelegramBot(TOKEN, {
  webHook: {
    port: Number(PORT),
  },
});

bot.setWebHook(`${HOST}/bot${TOKEN}`);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Configure',
            switch_inline_query: 'Configure me',
          },
        ],
      ],
    },
  });
});

bot.onText(/\/hi/, (msg) => {
  console.log('Hello');
  bot.sendMessage(msg.chat.id, 'Hello');
});

bot.onText(/\/info/, (msg) => {
  const { id: chatId } = msg.chat;
  console.log('HELLO');

  bot.sendMessage(chatId, 'Info');
});

bot.on('message', (msg) => {
  const { id: chatId } = msg.chat;
  const text = msg.text.toString().toLowerCase();
  console.log(text);
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
    console.log('Temporary file saved', tempPath);

    const child = spawn('ebook-convert', [tempPath, tempOutputPath]);
    child.stdout.on('close', () => {
      bot.sendDocument(chat.id, tempOutputPath, {}, {
        filename: convertedFilename,
        contentType: 'application/x-mobipocket-ebook',
      });
    });
  });
});
