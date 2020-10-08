const { generateRoom, getQuestions, shuffle } = require("../scripts/scripts");

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

const newRoom = async (name, userId, settings, cb) => {
  // console.log(name, userId, settings);
  generateRoom(name, userId, settings)
    .then((room) => {
      const collection = client
        .db(process.env.DB)
        .collection(process.env.COLLECTION);
      collection.insertOne(room, function (err, result) {
        if (err) throw err;
        cb(result);
      });
    })
    .catch((error) => error);
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
    { $set: { active: false, inSession: false } },
    function (err, result) {
      if (err) throw err;
      cb(result);
    }
  );
};

const inSession = (code, setting, cb) => {
  const collection = client
    .db(process.env.DB)
    .collection(process.env.COLLECTION);
  collection.updateOne(
    { room: code, active: true },
    { $set: { inSession: setting } },
    function (err, result) {
      if (err) throw err;
      cb(result);
    }
  );
};

const resetRoom = (roomId, settings, token, cb) => {
  getQuestions(settings, token)
    .then((data) => {
      let questions = data.questions.map((entry) => {
        entry.all_answers = shuffle(
          entry.incorrect_answers.concat(entry.correct_answer)
        );
        return entry;
      });
      const collection = client
        .db(process.env.DB)
        .collection(process.env.COLLECTION);
      collection.updateOne(
        { room: roomId, active: true },
        { $set: { "players.$[].score": 0, questions: questions } },
        function (err, result) {
          if (err) throw err;
          cb(result);
        }
      );
    })
    .catch((error) => error);
};

module.exports = {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  endGame,
  resetRoom,
  inSession,
};
