require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const findRoom = async (code) => {
  try {
    await client.connect();
    const collection = client.db("trivier").collection("games");
    collection
      .find({ room: code, active: true })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result.length);
        client.close();
        return result;
      });
  } catch (error) {
    (error) => error;
  }
};

const { generateRoom } = require("./scripts/generateRoom");
const newRoom = async (name) => {
  try {
    const room = generateRoom(name);
    await client.connect();
    const collection = client.db("trivier").collection("games");
    collection.insertOne(room, function (err, result) {
      if (err) throw err;
      console.log("Inserted");
      // client.close();
    });
  } catch (error) {
    (error) => error;
  }
};

module.exports = { findRoom, newRoom };
