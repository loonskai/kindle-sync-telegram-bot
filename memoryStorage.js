const Redis = require('ioredis');

const { REDIS_URL, REDIS_PASS } = process.env;

const redis = new Redis(`redis://:${REDIS_PASS}@${REDIS_URL}`);

redis.on('connect', () => {
  console.log('Connected to Redis');
});

module.exports = {
  async getFileIdByMessageId(messageId) {
    const result = await redis.get(messageId);
    return result;
  },
  async saveFileId(messageId, fileId) {
    await redis.set(messageId, fileId);
  },
  async deleteMessageId(messageId) {
    await redis.delete(messageId);
  },
};
