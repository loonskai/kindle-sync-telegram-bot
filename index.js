require('dotenv').config();

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN, {
  polling: true,
});

bot.onText(/\/echo (.+)/, (msg, metadata) => {
  const { id: chatId } = msg.chat;
  const resp = metadata[1];

  bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
  const { id: chatId } = msg.chat;
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
