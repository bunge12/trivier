const Express = require("express");
const morgan = require("morgan");
const PORT = 8001;

const app = Express();
app.use(morgan("dev"));

const { findRoom, newRoom } = require("./db");
const { generateRoom } = require("./scripts/generateRoom");

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
POST /api/game?id=ABCD&name=Artur
RES socket user added
*/

/*
Record score
POST /api/game/answer?id=ABCD&name=Artur&score=1
RES socket: move to next question 

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
