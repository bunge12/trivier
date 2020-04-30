const Express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const App = Express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

App.set("view engine", "ejs");
App.use(morgan("dev"));
App.use(Express.static("semantic/dist"));
App.use(cookieParser());

const { generateRoom } = require("./scripts/generateRoom");

App.get("/", (req, res) => {
  res.render("index");
});

App.get("/start", (req, res) => {
  res.render("start");
});

let rooms = {};

// Generates new room, adds to server, sets cookie, sends
App.post("/new", (req, res) => {
  const room = generateRoom();
  rooms[room.id] = room;
  res.cookie("room", room.id);
  res.send(room);
});

App.listen(port, () => {
  console.log(
    `Express seems to be listening on port ${port} so that's pretty good 👍`
  );
});
