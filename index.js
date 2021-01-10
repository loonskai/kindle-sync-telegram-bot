require('dotenv').config();

const path = require('path');

const db = require('./db');
const storage = require('./memoryStorage');
const bot = require('./init');
const { attachAndSendEmail } = require('./mail');
const { streamToString, saveTemporaryFile } = require('./utils/streams');
const { parseNotebookJSON } = require('./utils/parser');
const { validateEmail } = require('./utils/validations');
const { convert } = require('./bookConverter');
const { CALLBACK_DATA_ID, CONTENT_TYPES, FILE_FORMATS } = require('./constants');
const MESSAGES = require('./messages');

bot.onText(/\/start/, (msg) => {
  const { id: chatId } = msg.chat;
  bot.sendMessage(
    chatId,
    MESSAGES.START.text,
    MESSAGES.START.options,
  );
});

bot.onText(/\/settings/, (msg) => {
  const { id: chatId } = msg.chat;
  bot.sendMessage(
    chatId,
    MESSAGES.SETTINGS.text,
    MESSAGES.SETTINGS.options,
  );
});

bot.on('callback_query', async (query) => {
  console.log(query);
  const { id: callbackQueryId, data, message } = query;
  const [callbackId, callbackData] = data.split(' ');
  switch (callbackId) {
    case CALLBACK_DATA_ID.SETTINGS:
      bot.sendMessage(
        message.chat.id,
        MESSAGES.SETTINGS.text,
        MESSAGES.SETTINGS.options,
      );
      bot.answerCallbackQuery(callbackQueryId);
      break;
    case CALLBACK_DATA_ID.SET_KINDLE_EMAIL:
      bot.sendMessage(
        message.chat.id,
        MESSAGES.CHANGE_EMAIL.text,
        MESSAGES.CHANGE_EMAIL.options,
      );
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
      bot.sendMessage(message.chat.id, MESSAGES.ERRORS.UNKNOWN_OPERATION.text);
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

    if (from.is_bot && replyText === MESSAGES.CHANGE_EMAIL.text) {
      try {
        const { id } = await bot.getChat(chatId);
        const isValidEmail = validateEmail(text);
        if (!isValidEmail) {
          bot.sendMessage(chatId, MESSAGES.ERRORS.INVALID_EMAIL.text);
          return;
        }
        await db.saveKindleEmail({ id, email: text });
        bot.sendMessage(chatId, MESSAGES.SUCCESS.EMAIL_UPDATED.text);
      } catch (err) {
        bot.sendMessage(chatId, MESSAGES.ERRORS.EMAIL_ADDRESS_UPDATE_ERROR.text);
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

  switch (path.extname(fileName)) {
    // TODO: Add options for .epub files: "Convert", "Convert and send"
    case FILE_FORMATS.epub: {
      bot.sendMessage(chatId, MESSAGES.STATUS.FILE_BEING_CONVERTED.text);
      const fileStream = bot.getFileStream(fileId);
      try {
        const { convertedFileName, convertedFilePath } = await convert({
          inputFileName: fileName,
          inputFileStream: fileStream,
          outputFormat: FILE_FORMATS.mobi,
        });
        const { id: userId } = await bot.getChat(chatId);
        const { email } = await db.getKindleUser({ id: userId });

        try {
          bot.sendMessage(chatId, MESSAGES.STATUS.FILE_BEING_SENT.text);
          await attachAndSendEmail(email, {
            path: convertedFilePath,
            type: CONTENT_TYPES.mobi,
            filename: convertedFileName,
          });
          bot.sendDocument(
            chatId,
            convertedFilePath,
            { caption: MESSAGES.SUCCESS.FILE_SENT.text },
            {
              filename: convertedFileName,
              contentType: CONTENT_TYPES.mobi,
            },
          );
        } catch (emailError) {
          bot.sendDocument(
            chatId,
            convertedFilePath,
            { caption: MESSAGES.ERRORS.EMAIL_NOT_SENT.text },
            {
              filename: convertedFileName,
              contentType: CONTENT_TYPES.mobi,
            },
          );
        }
      } catch (fileError) {
        bot.sendMessage(chatId, MESSAGES.ERRORS.FILE_CONVERSION_ERROR.text);
      }
      break;
    }
    case FILE_FORMATS.mobi: {
      const fileStream = bot.getFileStream(fileId);
      const { id: userId } = await bot.getChat(chatId);
      const { email } = await db.getKindleUser({ id: userId });
      const tempFilePath = await saveTemporaryFile({ inputFileStream: fileStream, fileName });

      bot.sendMessage(chatId, MESSAGES.STATUS.FILE_BEING_SENT.text);
      try {
        await attachAndSendEmail(email, {
          path: tempFilePath,
          type: CONTENT_TYPES.mobi,
          filename: fileName,
        });
        bot.sendMessage(chatId, MESSAGES.SUCCESS.FILE_SENT.text);
      } catch (error) {
        bot.sendMessage(chatId, MESSAGES.ERRORS.EMAIL_NOT_SENT.text);
      }
      break;
    }
    case FILE_FORMATS.html: {
      storage.saveFileId(messageId, fileId);
      bot.sendMessage(
        chatId,
        MESSAGES.FILE_RECEIVED_HTML.text,
        MESSAGES.FILE_RECEIVED_HTML.getOptions(messageId),
      );
      break;
    }
    default:
      bot.sendMessage(chatId, MESSAGES.ERRORS.UNSUPPORTED_FILE.text);
  }
});
