const Express = require("express");
const morgan = require("morgan");
const app = Express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = 8001;

app.use(morgan("dev"));

const { findRoom, newRoom, addUser, postScore } = require("./db");

app.get("/", (req, res) => {
  res.send("Welcome to the API server!");
});
io.on("connection", (socket) => {
  socket.on("searchGame", (data) => {
    socket.join(data, () => {
      findRoom(data.toUpperCase(), (result) => {
        if (result.length < 1) {
          io.to(data).emit(`roomNotFound`);
          console.log("not found");
          socket.leave(data);
        } else {
          io.to(data).emit(`roomFound`, result[0].room);
        }
      });
    });
  });
  socket.on("newGame", (name) => {
    newRoom(name, (result) => {
      socket.join(result.ops[0].room, () => {
        io.to(result.ops[0].room).emit(`waitingToStart`, result.ops);
      });
    });
  });
  socket.on("addToGame", (roomId, name) => {
    addUser(roomId, name, (result) => {
      if (result.modifiedCount > 0) {
        findRoom(roomId.toUpperCase(), (result) => {
          socket.join(roomId, () => {
            io.to(roomId).emit(`waitingToStart`, result);
          });
        });
      } else {
        res.status(404).send("Error");
      }
    });
  });
});
// result[0].room
//
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
      res.status(200).send(result);
    } else {
      res.status(404).send(result);
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

http.listen(8001, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
