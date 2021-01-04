const { MongoClient } = require('mongodb');

const {
  MONGO_USER,
  MONGO_PASS,
  MONGO_DBNAME,
} = process.env;
const mongoURI = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@cluster0.0iqi2.mongodb.net/${MONGO_DBNAME}?retryWrites=true&w=majority`;

const client = new MongoClient(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect(() => {
  console.log('Connected to Mongo');
});

module.exports = {
  async getKindleUser(id) {
    const collection = await client.db(MONGO_DBNAME).collection('kindle-users');
    const data = await collection.findOne({}, { id });
    return data;
  },
  async saveKindleEmail({ id, email }) {
    const collection = await client.db(MONGO_DBNAME).collection('kindle-users');
    // TODO: Validate email format
    const result = await collection.insertOne({ id, email });
    return result;
  },
};
