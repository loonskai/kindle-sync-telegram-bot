const streamToString = async (readableStream, encoding = 'utf-8') => {
  const chunks = [];

  return new Promise((resolve, reject) => {
    readableStream.on('data', (data) => chunks.push(data));
    readableStream.on('error', (err) => reject(err));
    readableStream.on('end', () => {
      const result = Buffer.concat(chunks).toString(encoding);
      resolve(result);
    });
  });
};

module.exports = {
  streamToString,
};
