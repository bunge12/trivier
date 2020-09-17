const Express = require("express");
const morgan = require("morgan");
const PORT = 8001;

const app = Express();
app.use(morgan("dev"));

const { findRoom, newRoom, addUser, postScore } = require("./db");

app.get("/", (req, res) => {
  res.send("Welcome to the API server!");
});

/*
GET /api/game/:gameID
Retrieve existing game
RES Game JSON + socket connection TBD
*/
app.get("/api/game/:id", async (req, res) => {
  findRoom(req.params.id.toUpperCase(), (result) => {
    if (result.length < 1) {
      res.status(404).send("No game found");
    } else {
      res.status(200).send(result);
    }
  });
});

/*
POST /api/game/new/:name
Create new game with one player
RES Game JSON + socket connection TBD
*/
app.post("/api/game/new/:name", (req, res) => {
  newRoom(req.params.name, (result) => {
    res.status(200).send(result.ops);
  });
});

/*
Add user
POST /api/game/:id/name/:name
RES socket user added
*/
app.post("/api/game/:id/join/:name", (req, res) => {
  addUser(req.params.id, req.params.name, (result) => {
    if (result.modifiedCount > 0) {
      res.status(200).send("User Added");
    } else {
      res.status(404).send("Error");
    }
  });
});

/*
Record score
POST /api/game/answer?id=ABCD&name=Artur&score=1
RES socket: move to next question
*/
app.post("/api/game/:id/score/:name", (req, res) => {
  postScore(req.params.id, req.params.name, (result) => {
    if (result.modifiedCount > 0) {
      res
        .status(200)
        .send(`Score added for ${req.params.name}, game ${req.params.id}`);
    } else {
      res.status(404).send("Error");
    }
  });
});

/*
Restart game
POST /api/game/restart?id=ABCD
RES socket: new game

End game
POST /api/game/end?id=ABCD
RES socket: game over
*/

app.listen(8001, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
