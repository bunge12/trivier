const Express = require("express");
const morgan = require("morgan");
const app = Express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = 8001;
const NUM_QUES = 1; //+1
const INTERVAL = 6000; // in ms

app.use(morgan("dev"));

const {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  disconnect,
  endGame,
} = require("./db");

app.get("/", (req, res) => {
  res.send("Welcome to the game server!");
});
io.on("connection", (socket) => {
  let trackUserId;
  let trackRoomId;
  let trackAdmin;
  socket.on("searchGame", (data) => {
    socket.join(data, () => {
      findRoom(data.toUpperCase(), (result) => {
        if (result.length < 1) {
          socket.emit(`roomNotFound`);
          console.log("not found");
          socket.leave(data);
        } else {
          socket.emit(`roomFound`, result[0].room);
        }
      });
    });
  });
  socket.on("newGame", (name, userId) => {
    newRoom(name, userId, (result) => {
      socket.join(result.ops[0].room, () => {
        trackUserId = userId;
        trackRoomId = result.ops[0].room;
        trackAdmin = true;
        console.log(`New room ${trackRoomId} created by ${trackUserId}`);
        io.to(result.ops[0].room).emit(`waitingToStart`, result.ops, true);
      });
    });
  });
  socket.on("addToGame", (roomId, name, userId) => {
    addUser(roomId, name, userId, (result) => {
      trackUserId = userId;
      trackRoomId = roomId;
      if (result.modifiedCount > 0) {
        findRoom(roomId.toUpperCase(), (result) => {
          socket.join(roomId, () => {
            io.to(roomId).emit(`waitingToStart`, result, false);
          });
        });
      } else {
        res.status(404).send("Error");
      }
    });
  });
  socket.on("disconnect", () => {
    console.log("someone disc", trackUserId, trackRoomId, trackAdmin);
    if (
      typeof trackUserId !== "undefined" &&
      typeof trackRoomId !== "undefined" &&
      trackAdmin
    ) {
      endGame(trackRoomId, (result) => {
        if (result.modifiedCount > 0) {
          io.to(trackRoomId).emit(`gameEnded`);
          socket.leave(trackRoomId);
        } else {
          io.to(trackRoomId).emit(`serverError`);
        }
      });
    }
    if (
      typeof trackUserId !== "undefined" &&
      typeof trackRoomId !== "undefined"
    ) {
      removeUser(trackRoomId, trackUserId, (result) => {
        if (result.modifiedCount > 0) {
          findRoom(trackRoomId.toUpperCase(), (result) => {
            io.to(trackRoomId).emit(`waitingToStart`, result, false);
          });
        } else {
          io.to(trackRoomId).emit(`serverError`);
        }
      });
    }
  });
  socket.on("startGame", (roomId) => {
    findRoom(roomId.toUpperCase(), (result) => {
      io.to(roomId).emit(`gameStarted`, result);
      let count = 0;
      const interval = setInterval(() => {
        if (count === NUM_QUES) {
          findRoom(roomId.toUpperCase(), (result) => {
            io.to(roomId).emit(`gameOver`, result);
          });
          // io.to(roomId).emit(`gameOver`);
          clearInterval(interval);
        } else {
          count++;
          io.to(roomId).emit(`nextQuestion`, result, count);
        }
      }, INTERVAL);
      // if (count === 3) clearInterval(interval);
    });
  });
  socket.on("recordScore", (gameId, userId) => {
    postScore(gameId, userId, (result) => {
      if (result.modifiedCount > 0) {
        console.log("score recorded");
      } else {
        console.log("score not recorded");
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
Remove user
POST /api/game/:id/remove/:name
*/
app.post("/api/game/:id/remove/:name", (req, res) => {
  removeUser(req.params.id, req.params.name, (result) => {
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
POST /api/game/:id/finish
*/
app.post("/api/game/:id/finish", (req, res) => {
  endGame(req.params.id, (result) => {
    if (result.modifiedCount > 0) {
      res.status(200).send(`Game ${req.params.id} ended`);
    } else {
      res.status(404).send("Error");
    }
  });
});

http.listen(8001, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
