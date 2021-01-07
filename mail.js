const sgMail = require('@sendgrid/mail');
const fs = require('fs');

const { SENDGRID_API_KEY, MAIL_SENDER } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const attachAndSendEmail = async (toEmail, { path, filename, type }) => new Promise(
  (resolve, reject) => {
    fs.readFile(path, async (err, data) => {
      if (err) {
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
          console.log(mailError);
          if (mailError.response) {
            console.log(mailError.response.body);
          }
          reject(new Error('Unable to send email'));
        }
      }
    });
  },
);

const validateEmail = (email) => {
  const tester = /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  if (!email) return false;

  if (email.length > 256) return false;

  if (!tester.test(email)) return false;

  const emailParts = email.split('@');
  const account = emailParts[0];
  const address = emailParts[1];
  if (account.length > 64) return false;

  const domainParts = address.split('.');
  if (domainParts.some((part) => part.length > 63)) return false;

  return true;
};

module.exports = {
  attachAndSendEmail,
  validateEmail,
};
