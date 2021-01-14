const sgMail = require('@sendgrid/mail');
const fs = require('fs');

const { SENDGRID_API_KEY, MAIL_SENDER } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const attachAndSendEmail = async (toEmail, { path, filename, type }) => new Promise(
  (resolve, reject) => {
    fs.readFile(path, async (err, data) => {
      console.log('data ---', data);
      if (err) {
        console.log('Unable to read file', err);
        reject(new Error('Unable to read file', path));
      } else {
        const msg = {
          to: toEmail,
          from: MAIL_SENDER,
          subject: '[Kindle Sync Bot] New Book',
          html: '<p>Here’s a new book from Telegram Kindle Sync Bot.</p>',
          attachments: [{
            content: data.toString('base64'),
            filename,
            type,
            disposition: 'attachment',
          }],
        };
        try {
          await sgMail.send(msg);
          resolve();
        } catch (mailError) {
          console.log('Unable to send email', mailError);
          if (mailError.response) {
            console.log(mailError.response.body);
          }
          reject(new Error('Unable to send email'));
        }
      }
    });
  },
);

module.exports = {
  attachAndSendEmail,
};
