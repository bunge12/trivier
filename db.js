require("dotenv").config();
const { generateRoom } = require("./scripts/scripts");

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

const newRoom = async (name, userId, cb) => {
  await generateRoom(name, userId).then((room) => {
    const collection = client
      .db(process.env.DB)
      .collection(process.env.COLLECTION);
    collection.insertOne(room, function (err, result) {
      if (err) throw err;
      cb(result);
    });
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
const newQuestions = [
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "How many colors are there in a rainbow?",
    correct_answer: "7",
    incorrect_answers: ["8", "9", "10"],
  },
];
const resetRoom = (roomId, cb) => {
  const collection = client
    .db(process.env.DB)
    .collection(process.env.COLLECTION);
  collection.updateOne(
    { room: roomId, active: true },
    { $set: { "players.$[].score": 0, questions: newQuestions } },
    function (err, result) {
      if (err) throw err;
      cb(result);
    }
  );
};

module.exports = {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  endGame,
  resetRoom,
};
