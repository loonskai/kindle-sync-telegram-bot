const path = require('path');
const { spawn } = require('child_process');
const { getTempFilePath, saveTemporaryFile } = require('./utils/streams');

const convert = ({ inputFileName, inputFileStream, outputFormat }) => new Promise(
  // eslint-disable-next-line no-async-promise-executor
  async (resolve, reject) => {
    const { name: baseName } = path.parse(inputFileName);
    const convertedFileName = baseName + outputFormat;
    const convertedFilePath = getTempFilePath(convertedFileName);

    /* Save file localy in order to pass it to calibri CLI */
    const tempFilePath = await saveTemporaryFile({ inputFileStream, fileName: inputFileName });
    /* Start converting after the file saved */
    const calibriProcess = spawn('ebook-convert', [tempFilePath, convertedFilePath]);
    // TODO: Add error handling for calibri conversion
    calibriProcess.stdout.on('close', () => {
      resolve({ convertedFilePath, convertedFileName });
    });
  },
);

module.exports = {
  convert,
};
