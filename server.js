require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  perMessageDeflate: false,
});
const PORT = process.env.PORT;
const corsOptions = {
  origin: process.env.ORIGIN,
  optionsSuccessStatus: 200,
};

// Game Settings
const NUM_QUES = 9; //Number of questions +1
const INTERVAL = 11000; // in ms

const {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  resetRoom,
  endGame,
} = require("./db/db");

app.use(cors(corsOptions));

app.get("*", (req, res) => {
  res.cookie({ sameSite: "none", secure: false });
  res.send("Welcome to trivier");
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
        io.to(roomId).emit(`serverError`);
      }
    });
  });
  socket.on("leaveRoom", (roomId, userId, admin) => {
    if (admin) {
      endGame(roomId, (result) => {
        if (result.modifiedCount > 0) {
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
    if (
      typeof trackUserId !== "undefined" &&
      typeof trackRoomId !== "undefined" &&
      trackAdmin
    ) {
      endGame(trackRoomId, (result) => {
        io.to(trackRoomId).emit(`gameEnded`);
        socket.leave(trackRoomId);
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
          clearInterval(interval);
        } else {
          io.to(roomId).emit(`nextQuestion`, result, count);
          count++;
        }
      }, INTERVAL);
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

http.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
