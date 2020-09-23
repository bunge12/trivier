require("dotenv").config();
const { generateRoom, generateId } = require("./scripts/generateRoom");

const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const findRoom = async (code, cb) => {
  try {
    await client.connect();
    const collection = client
      .db(process.env.DB)
      .collection(process.env.COLLECTION);
    collection
      .find({ room: code, active: true })
      .toArray(function (err, result) {
        if (err) throw err;
        cb(result);
      });
  } catch (error) {
    (error) => error;
  }
};

const newRoom = async (name, userId, cb) => {
  try {
    const room = generateRoom(name, userId);
    await client.connect();
    const collection = client
      .db(process.env.DB)
      .collection(process.env.COLLECTION);
    collection.insertOne(room, function (err, result) {
      if (err) throw err;
      cb(result);
    });
  } catch (error) {
    (error) => error;
  }
};

const addUser = async (code, name, userId, cb) => {
  try {
    await client.connect();
    const collection = client
      .db(process.env.DB)
      .collection(process.env.COLLECTION);
    collection.updateOne(
      { room: code, active: true },
      { $push: { players: { id: userId, name: name, score: 0 } } },
      function (err, result) {
        if (err) throw err;
        cb(result);
      }
    );
  } catch (error) {
    (error) => error;
  }
};

// to-do: update from name to user ID
const postScore = async (code, name, cb) => {
  try {
    await client.connect();
    const collection = client
      .db(process.env.DB)
      .collection(process.env.COLLECTION);
    collection.updateOne(
      { room: code, active: true, "players.name": name },
      { $inc: { "players.$.score": 1 } },
      function (err, result) {
        if (err) throw err;
        cb(result);
      }
    );
  } catch (error) {
    (error) => error;
  }
};

const removeUser = async (code, userId, cb) => {
  try {
    await client.connect();
    const collection = client
      .db(process.env.DB)
      .collection(process.env.COLLECTION);
    collection.updateOne(
      { room: code, active: true },
      { $pull: { players: { id: userId } } },
      function (err, result) {
        if (err) throw err;
        cb(result);
      }
    );
  } catch (error) {
    (error) => error;
  }
};

module.exports = { findRoom, newRoom, addUser, postScore, removeUser };
