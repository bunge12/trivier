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
const { generateRoom } = require("./scripts/generateRoom");

App.get("/start", (req, res) => {
  let name = null;
  req.cookies.name ? (name = req.cookies.name) : (name = null);
  res.render("start", { name });
});

let rooms = {};

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
App.get("/game", (req, res) => {
  const room = req.cookies.room;
  res.render("game", { room });
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
