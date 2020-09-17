require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const findRoom = async (code, cb) => {
  try {
    await client.connect();
    const collection = client.db("trivier").collection("games");
    const response = collection
      .find({ room: code, active: true })
      .toArray(function (err, result) {
        if (err) throw err;
        cb(result);
        return result;
      });
  } catch (error) {
    (error) => error;
  }
};

const { generateRoom } = require("./scripts/generateRoom");
const newRoom = async (name, cb) => {
  try {
    const room = generateRoom(name);
    await client.connect();
    const collection = client.db("trivier").collection("games");
    collection.insertOne(room, function (err, result) {
      if (err) throw err;
      console.log("Inserted");
      cb(result);
    });
  } catch (error) {
    (error) => error;
  }
};

module.exports = { findRoom, newRoom };

// console.log(findRoom("ABCD"));
