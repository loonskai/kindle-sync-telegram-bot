require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const db = require('./db');
const storage = require('./memoryStorage');
const bot = require('./init');
const { attachAndSendEmail } = require('./mail');
const { streamToString } = require('./utils/streams');
const { parseNotebookJSON } = require('./utils/parser');
const { CALLBACK_DATA_ID } = require('./constants');

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Configure', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Configuration',
            callback_data: CALLBACK_DATA_ID.CONFIGURATION,
          },
        ],
      ],
    },
  });
});

bot.on('callback_query', async (query) => {
  console.log(query);
  const { id: callbackQueryId, data, message } = query;
  const [callbackId, callbackData] = data.split(' ');
  switch (callbackId) {
    case CALLBACK_DATA_ID.CONFIGURATION:
      bot.sendMessage(message.chat.id, 'Configuration', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Change Kindle email',
                callback_data: CALLBACK_DATA_ID.SET_KINDLE_EMAIL,
              },
            ],
          ],
        },
      });
      bot.answerCallbackQuery(callbackQueryId);
      break;
    case CALLBACK_DATA_ID.SET_KINDLE_EMAIL:
      bot.sendMessage(message.chat.id, 'Enter your Kindle email', {
        reply_markup: {
          force_reply: true,
        },
      });
      bot.answerCallbackQuery(callbackQueryId);
      break;
    case CALLBACK_DATA_ID.SELECT_NOTEBOOK: {
      const messageId = callbackData;
      const fileId = await storage.getFileIdByMessageId(messageId);
      const fileStream = bot.getFileStream(fileId);
      const htmlString = await streamToString(fileStream);

      const notebookJSON = await parseNotebookJSON(htmlString);
      console.log('notebookJSON', notebookJSON);

      // await storage.deleteMessageId(messageId);
      bot.answerCallbackQuery(callbackQueryId);
      break;
    }
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
      try {
        const { id } = await bot.getChat(chatId);
        await db.saveKindleEmail({ id, email: text });
        bot.sendMessage(chatId, 'Email updated successfully');
      } catch (err) {
        bot.sendMessage(chatId, 'Couldn\'t update the email. Check if it\'s valid or check bot logs.');
      }
    }
  }
});

bot.on('document', async (msg) => {
  const {
    message_id: messageId,
    chat: {
      id: chatId,
    },
    document: {
      file_id: fileId,
      file_name: fileName,
    },
  } = msg;
  const { ext: extName, name: baseName } = path.parse(fileName);
  const TEMPDIR = os.tmpdir();

  switch (extName) {
    case '.epub': {
      bot.sendMessage(chatId, 'Converting your book to .mobi...');
      const fileStream = bot.getFileStream(fileId);
      const tempPath = path.join(TEMPDIR, fileName);
      const convertedFilename = `${baseName}.mobi`;
      const tempOutputPath = path.join(TEMPDIR, convertedFilename);

      const writeStream = fs.createWriteStream(tempPath, { flags: 'w' });
      fileStream.pipe(writeStream);

      writeStream.on('close', () => {
        const child = spawn('ebook-convert', [tempPath, tempOutputPath]);
        child.stdout.on('close', async () => {
          const { id: userId } = await bot.getChat(chatId);
          const { email } = await db.getKindleUser({ id: userId });

          try {
            await attachAndSendEmail(email, {
              path: tempOutputPath,
              type: 'application/x-mobipocket-ebook',
              filename: convertedFilename,
            });
            bot.sendDocument(chatId, tempOutputPath,
              {
                caption: 'Converted .mobi file was sent to your Kindle account.',
              }, {
                filename: convertedFilename,
                contentType: 'application/x-mobipocket-ebook',
              });
          } catch (err) {
            bot.sendDocument(chatId, tempOutputPath,
              {
                caption: 'Unable to send the file to your Kindle account. Check logs for more details.',
              },
              {
                filename: convertedFilename,
                contentType: 'application/x-mobipocket-ebook',
              });
          }
        });
      });
      break;
    }
    case '.html': {
      storage.saveFileId(messageId, fileId);
      bot.sendMessage(chatId, 'What should I do with this HTML file?', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Parse it to JSON and update',
                callback_data: `${CALLBACK_DATA_ID.SELECT_NOTEBOOK} ${messageId}`,
              },
            ],
          ],
        },
      });
      break;
    }
    default:
      bot.sendMessage(chatId, 'Unsupported file extension');
  }
});
