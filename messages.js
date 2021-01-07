const { CALLBACK_DATA_ID } = require('./constants');

module.exports = {
  START: {
    text: 'Welcome to Kindle Sync Bot!',
    options: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Settings',
              callback_data: CALLBACK_DATA_ID.SETTINGS,
            },
          ],
        ],
      },
    },
  },
  SETTINGS: {
    text: 'Select settings:',
    options:
      {
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
      },
  },
  CHANGE_EMAIL: {
    text: 'Enter your Kindle email:',
    options: {
      reply_markup: {
        force_reply: true,
      },
    },
  },
  FILE_RECEIVED_EPUB: {

  },
  FILE_RECEIVED_HTML: {
    text: 'What should I do with this HTML file?',
    getOptions: (messageId) => ({
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
    }),
  },
  STATUS: {
    FILE_BEING_CONVERTING: {
      text: 'Converting file ...',
    },
  },
  SUCCESS: {
    FILE_SENT: {
      text: 'Converted .mobi file has been sent to your Kindle account.',
    },
    EMAIL_UPDATED: {
      text: 'Email has been updated.',
    },
  },
  ERRORS: {
    INVALID_EMAIL: {
      text: 'Please provide a valid email.',
    },
    EMAIL_ADDRESS_UPDATE_ERROR: {
      text: 'Couldn\'t update the email. Check the logs for more details.',
    },
    EMAIL_NOT_SENT: {
      text: 'Unable to send the file to your Kindle account. Check the logs for more details.',
    },
    FILE_CONVERSION_ERROR: {
      text: 'Unable to convert your file. Check the logs for more details.',
    },
    UNSUPPORTED_FILE: {
      text: 'Unsupported file.',
    },
    UNKNOWN_OPERATION: {
      text: 'Unknown operation.',
    },
  },
};
