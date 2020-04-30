const Express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const App = Express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

App.set("view engine", "ejs");
App.use(morgan("dev"));
App.use(Express.static("semantic/dist"));
App.use(cookieParser());
App.use(bodyParser.urlencoded({ extended: true }));

const { generateRoom } = require("./scripts/generateRoom");

App.get("/", (req, res) => {
  res.render("index");
});

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

App.listen(port, () => {
  console.log(
    `Express seems to be listening on port ${port} so that's pretty good 👍`
  );
});
