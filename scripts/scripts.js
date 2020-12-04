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

const getQuestions = (settings, token) => {
  let setDifficulty = "";
  if (settings.difficulty !== "any") {
    setDifficulty = `&difficulty=${settings.difficulty}`;
  }
  if (token === "" || !token || token.length === 0) {
    return axios
      .get(`https://opentdb.com/api_token.php?command=request`)
      .then((response) => {
        token = response.data.token;
        return axios.get(
          `https://opentdb.com/api.php?amount=10&category=${settings.category}&token=${token}${setDifficulty}`
        );
      })
      .then((data) => {
        return { token, questions: data.data.results };
      })
      .catch((error) => error);
  } else {
    return axios
      .get(
        `https://opentdb.com/api.php?amount=10&category=${settings.category}&token=${token}${setDifficulty}`
      )
      .then((data) => {
        return { token, questions: data.data.results };
      })
      .catch((error) => error);
  }
};

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateRoom = async (name, userId, settings) => {
  const room = generateId(4);
  let result = {};
  return getQuestions(settings, false)
    .then((data) => {
      let questions = data.questions.map((entry) => {
        entry.all_answers = shuffle(
          entry.incorrect_answers.concat(entry.correct_answer)
        );
        return entry;
      });
      let players = [{ id: userId, name, score: 0 }];
      result = {
        room,
        token: data.token,
        active: true,
        inSession: false,
        players,
        questions: questions,
        answered: 0,
      };
      return result;
    })
    .catch((error) => error);
};

module.exports = { generateRoom, generateId, getQuestions, shuffle };
