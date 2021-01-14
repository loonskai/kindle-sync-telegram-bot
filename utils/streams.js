const os = require('os');
const path = require('path');
const fs = require('fs');

const streamToString = async (readableStream, encoding = 'utf-8') => {
  const chunks = [];

  return new Promise((resolve, reject) => {
    readableStream.on('data', (data) => chunks.push(data));
    readableStream.on('error', (err) => {
      console.log('Error converting stream to string', err);
      reject(err);
    });
    readableStream.on('end', () => {
      const result = Buffer.concat(chunks).toString(encoding);
      resolve(result);
    });
  });
};

const getTempFilePath = (fileName) => path.join(os.tmpdir(), fileName);

const saveTemporaryFile = ({ inputFileStream, fileName }) => new Promise((resolve, reject) => {
  const tempFilePath = getTempFilePath(fileName);
  const writeStream = fs.createWriteStream(tempFilePath, { flags: 'w' });
  inputFileStream.pipe(writeStream);

  writeStream.on('close', () => {
    resolve(tempFilePath);
  });
  writeStream.on('error', (err) => {
    console.log('Error saving temp file', err);
    reject(err);
  });
});

module.exports = {
  getTempFilePath,
  streamToString,
  saveTemporaryFile,
};
