const host = process.env.NODE_ENV === 'development' ? process.env.NGROK_URL : process.env.HOST;

module.exports = {
  host,
};
