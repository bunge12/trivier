// Generates room  ID, loads questions from API, returns room with questions and players as object
const axios = require("axios");

const generateId = (length) => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getQuestions = () => {
  return axios
    .get("https://opentdb.com/api.php?amount=10&category=9")
    .then((data) => {
      return data.data.results;
    })
    .catch((error) => error);
};

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateRoom = async (name, userId) => {
  const room = generateId(4);
  let result = {};
  return getQuestions()
    .then((data) => {
      let questions = data.map((entry) => {
        entry.all_answers = shuffle(
          entry.incorrect_answers.concat(entry.correct_answer)
        );
        return entry;
      });
      let players = [{ id: userId, name, score: 0 }];
      result = { room, active: true, players, questions: questions };
      return result;
    })
    .catch((error) => error);
};

module.exports = { generateRoom, generateId, getQuestions, shuffle };
