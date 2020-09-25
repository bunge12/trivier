require("dotenv").config();
const { generateRoom } = require("./scripts/generateRoom");

const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect();

const findRoom = (code, cb) => {
  const collection = client
    .db(process.env.DB)
    .collection(process.env.COLLECTION);
  collection.find({ room: code, active: true }).toArray(function (err, result) {
    if (err) throw err;
    cb(result);
  });
};

const newRoom = (name, userId, cb) => {
  const room = generateRoom(name, userId);
  const collection = client
    .db(process.env.DB)
    .collection(process.env.COLLECTION);
  collection.insertOne(room, function (err, result) {
    if (err) throw err;
    cb(result);
  });
};

const addUser = (code, name, userId, cb) => {
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
};

const postScore = (code, userId, cb) => {
  const collection = client
    .db(process.env.DB)
    .collection(process.env.COLLECTION);
  collection.updateOne(
    { room: code, active: true, "players.id": userId },
    { $inc: { "players.$.score": 1 } },
    function (err, result) {
      if (err) throw err;
      cb(result);
    }
  );
};

const removeUser = (code, userId, cb) => {
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
};

const endGame = (code, cb) => {
  const collection = client
    .db(process.env.DB)
    .collection(process.env.COLLECTION);
  collection.updateOne(
    { room: code, active: true },
    { $set: { active: false } },
    function (err, result) {
      if (err) throw err;
      cb(result);
    }
  );
};

const disconnect = () => {
  client.close();
};

module.exports = {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  disconnect,
  endGame,
};
