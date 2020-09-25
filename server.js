require("dotenv").config();
const Express = require("express");
const morgan = require("morgan");
const app = Express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
  PORT = 8001;
}
const NUM_QUES = 0; //+1
const INTERVAL = 6000; // in ms

app.use(morgan("dev"));

const {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  resetRoom,
  endGame,
} = require("./db/db");

app.use(Express.static(path.join(__dirname, "build")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
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
  socket.on("leaveRoom", (roomId, userId, admin) => {
    if (admin) {
      endGame(roomId, (result) => {
        if (result.modifiedCount > 0) {
          console.log("admin disconnected, game deleted");
          io.to(roomId).emit(`gameEnded`);
          socket.leave(roomId);
        } else {
          io.to(roomId).emit(`serverError`);
        }
      });
    } else {
      removeUser(roomId, userId, (result) => {
        if (result.modifiedCount > 0) {
          findRoom(roomId.toUpperCase(), (result) => {
            io.to(roomId).emit(`someoneLeft`, result);
          });
        } else {
          io.to(roomId).emit(`serverError`);
        }
      });
    }
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
          io.to(roomId).emit(`nextQuestion`, result, count);
          count++;
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
  socket.on("playAgain", (gameId) => {
    resetRoom(gameId, (result) => {
      if (result.modifiedCount > 0) {
        findRoom(gameId.toUpperCase(), (result) => {
          io.to(gameId).emit(`waitingToStart`, result, true);
        });
      } else {
        io.to(gameId).emit(`serverError`);
      }
    });
  });
});

http.listen(8001, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
