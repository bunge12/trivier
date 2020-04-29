const Express = require("express");
const morgan = require("morgan");
const App = Express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

App.use(morgan("dev"));
App.use(Express.static("semantic/dist"));

App.set("view engine", "ejs");

App.get("/", (req, res) => {
  res.render("index");
});

App.post("/new", (req, res) => {
  console.log("new received");
  res.sendStatus(200);
});

App.listen(port, () => {
  console.log(
    `Express seems to be listening on port ${port} so that's pretty good 👍`
  );
});