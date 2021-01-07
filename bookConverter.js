const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const TEMPDIR = os.tmpdir();

const convert = ({ inputFileName, inputFileStream, outputFormat }) => new Promise(
  (resolve, reject) => {
    const { ext: extName, name: baseName } = path.parse(inputFileName);
    const tempFilePath = path.join(TEMPDIR, inputFileName);
    const convertedFileName = baseName + outputFormat;
    const convertedFilePath = path.join(TEMPDIR, convertedFileName);

    /* Save file localy in order to pass it to calibri CLI */
    const writeStream = fs.createWriteStream(tempFilePath, { flags: 'w' });
    inputFileStream.pipe(writeStream);

    /* Start converting after the file saved */
    // TODO: Add error handling for local saving
    writeStream.on('close', () => {
      const calibriProcess = spawn('ebook-convert', [tempFilePath, convertedFilePath]);
      // TODO: Add error handling for calibri conversion
      calibriProcess.stdout.on('close', async () => {
        resolve({ convertedFilePath, convertedFileName });
      });
    });
  },
);

module.exports = {
  convert,
};
