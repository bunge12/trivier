// Generates room  ID, loads questions from API, returns room with questions and players as object

const generateId = (length) => {
  var result = "";
  var characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const questions = [
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "What is the French word for &quot;hat&quot;?",
    correct_answer: "Chapeau",
    incorrect_answers: ["Bonnet", " &Eacute;charpe", " Casque"],
  },
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "How many colors are there in a rainbow?",
    correct_answer: "7",
    incorrect_answers: ["8", "9", "10"],
  },
  {
    category: "Entertainment: Music",
    type: "boolean",
    difficulty: "easy",
    question:
      "The music group Daft Punk got their name from a negative review they recieved.",
    correct_answer: "True",
    incorrect_answers: ["False"],
  },
  {
    category: "Entertainment: Music",
    type: "boolean",
    difficulty: "easy",
    question: "American rapper Dr. Dre actually has a Ph.D. doctorate.",
    correct_answer: "False",
    incorrect_answers: ["True"],
  },

  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question:
      "What machine element is located in the center of fidget spinners?",
    correct_answer: "Bearings",
    incorrect_answers: ["Axles", "Gears", "Belts"],
  },
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "Which of the following presidents is not on Mount Rushmore?",
    correct_answer: "John F. Kennedy",
    incorrect_answers: [
      "Theodore Roosevelt",
      "Abraham Lincoln",
      "Thomas Jefferson",
    ],
  },
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "In which fast food chain can you order a Jamocha Shake?",
    correct_answer: "Arby&#039;s",
    incorrect_answers: ["McDonald&#039;s", "Burger King", "Wendy&#039;s"],
  },
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "What nuts are used in the production of marzipan?",
    correct_answer: "Almonds",
    incorrect_answers: ["Peanuts", "Walnuts", "Pistachios"],
  },
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question:
      "Terry Gilliam was an animator that worked with which British comedy group?",
    correct_answer: "Monty Python",
    incorrect_answers: [
      "The Goodies&lrm;",
      "The League of Gentlemen&lrm;",
      "The Penny Dreadfuls",
    ],
  },
  {
    category: "General Knowledge",
    type: "multiple",
    difficulty: "easy",
    question: "How many furlongs are there in a mile?",
    correct_answer: "Eight",
    incorrect_answers: ["Two", "Four", "Six"],
  },
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateRoom = (name, userId) => {
  const room = generateId(4);
  let result = {};
  let newQuestions = questions.map((entry) => {
    console.log(typeof entry.incorrect_answers);
    entry.all_answers = shuffle(
      entry.incorrect_answers.concat(entry.correct_answer)
    );
    return entry;
  });
  let players = [{ id: userId, name, score: 0 }];
  result = { room, active: true, players, questions: newQuestions };
  return result;
};

module.exports = { generateRoom, generateId };
