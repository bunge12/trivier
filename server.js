const Express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");

const App = Express();

App.use(morgan("dev"));
App.use(Express.static("semantic/dist"));
App.use(cookieParser());
App.use(bodyParser.urlencoded({ extended: true }));
const publicPath = path.join(__dirname, "../public");
// App.use(Express.static(publicPath));
App.use(Express.static("public"));
///
const { findRoom, newRoom } = require("./db");

App.get("/start", (req, res) => {
  let name = null;
  req.cookies.name ? (name = req.cookies.name) : (name = null);
  res.render("start", { name });
});

// Generates new room, adds to server, sets cookie, sends
App.post("/new", (req, res) => {
  const { name } = req.body;
  const room = generateRoom(name);
  rooms[room.id] = room;
  res.cookie("name", name);
  res.cookie("room", room.id);
  res.send(room);
});

// Room & Game
App.get("/game/:id", async (req, res) => {
  const id = req.id;
  const result = await findRoom(id);
  // const room = req.cookies.room;
  res.send(result);
});

App.post("/game/:id", (req, res) => {
  const id = req.id;
  let result = null;
  res.send(result);
});

App.listen(8000, () => {
  console.log(
    `Express seems to be listening on port 8000 so that's pretty good 👍`
  );
});

/* 
Find existing game
GET /api/game/:id
RES Game JSON

Create new game
POST /api/game/new?name=Artur
RES Game JSON

Add user
POST /api/game?id=ABCD&name=Artur

Record score
POST /api/game/answer?id=ABCD&name=Artur&score=1

Restart game
POST /api/game/restart?id=ABCD

End game
POST /api/game/end?id=ABCD

*/
