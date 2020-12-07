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
const NUM_QUES = parseInt(process.env.NUM_QUES); //Number of questions +1
const INTERVAL = 12000; // in ms

// DB Operators
const {
  findRoom,
  newRoom,
  addUser,
  postScore,
  removeUser,
  resetRoom,
  endGame,
  inSession,
  resetAnswered,
} = require("./db/db");
const { clearInterval } = require("timers");

app.use(cors(corsOptions));

app.get("*", (req, res) => {
  res.cookie({ sameSite: "none", secure: false });
  res.send("Welcome to trivier");
});

io.on("connection", (socket) => {
  let trackUserId;
  let trackRoomId;
  let trackAdmin;

  // Looks for roomId in DB, joins user to room if found
  socket.on("searchRoom", (roomId) => {
    socket.join(roomId, () => {
      findRoom(roomId.toUpperCase(), (result) => {
        if (result.length < 1) {
          socket.emit(`roomNotFound`);
          socket.leave(roomId);
        } else if (result[0].inSession) {
          socket.emit(
            `gameEnded`,
            `Game is currently in session. Try again later or join a different room.`
          );
          socket.leave(roomId);
        } else {
          socket.emit(`roomFound`, result[0].room);
        }
      });
    });
  });

  // Creates a new room with a name & userId provided as admin
  socket.on("newGame", (name, userId, settings) => {
    newRoom(name, userId, settings, (result) => {
      socket.join(result.ops[0].room, () => {
        if (result.ops[0].questions.length === 0) {
          io.to(result.ops[0].room).emit(
            `gameEnded`,
            `Couldn't start game since the category doesn't have enough questions.`
          );
          socket.leave(result.ops[0].room);
        } else {
          trackUserId = userId;
          trackRoomId = result.ops[0].room;
          trackAdmin = true;
          console.log(`New room ${trackRoomId} created by ${trackUserId}`);
          io.to(result.ops[0].room).emit(
            `waitingToStart`,
            result.ops,
            NUM_QUES + 1,
            true
          );
        }
      });
    });
  });

  // Adds user to an existing room
  socket.on("addToGame", (roomId, name, userId) => {
    addUser(roomId, name, userId, (result) => {
      trackUserId = userId;
      trackRoomId = roomId;
      if (result.modifiedCount > 0) {
        findRoom(roomId.toUpperCase(), (result) => {
          socket.join(roomId, () => {
            io.to(roomId).emit(`waitingToStart`, result, NUM_QUES + 1, false);
          });
        });
      } else {
        socket.emit(
          `gameEnded`,
          `Server error: could not add player to the game.`
        );
        socket.leave(roomId);
      }
    });
  });

  // Leave room, end game if admin, send updated room details if not
  socket.on("leaveRoom", (roomId, userId, admin) => {
    if (admin) {
      endGame(roomId, (result) => {
        if (result.modifiedCount > 0) {
          console.log(`Room ${roomId} removed`);
          io.to(roomId).emit(`gameEnded`, `Game ended since admin left.`);
          socket.leave(roomId);
        } else {
          io.to(roomId).emit(`gameEnded`, `Game did not end well.`);
          socket.leave(roomId);
        }
      });
    } else {
      removeUser(roomId, userId, (result) => {
        if (result.modifiedCount > 0) {
          findRoom(roomId.toUpperCase(), (result) => {
            io.to(roomId).emit(`someoneLeft`, result);
            socket.leave(roomId);
          });
        } else {
          io.to(roomId).emit(
            `gameError`,
            `player left but couldn't be removed`
          );
          socket.leave(roomId);
        }
      });
    }
  });

  // On disconnect, remove room if admin left, remove user from room if not admin
  socket.on("disconnect", () => {
    if (
      typeof trackUserId !== "undefined" &&
      typeof trackRoomId !== "undefined" &&
      trackAdmin
    ) {
      endGame(trackRoomId, (result) => {
        console.log(`Game ${trackRoomId} removed`);
        io.to(trackRoomId).emit(
          `gameEnded`,
          `Game ended since admin disconnected`
        );
        socket.leave(trackRoomId);
      });
      return;
    }
    if (
      typeof trackUserId !== "undefined" &&
      typeof trackRoomId !== "undefined"
    ) {
      removeUser(trackRoomId, trackUserId, (result) => {
        if (result) {
          findRoom(trackRoomId.toUpperCase(), (result) => {
            io.to(trackRoomId).emit(`someoneLeft`, result);
          });
        } else {
          io.to(trackRoomId).emit(
            `gameEnded`,
            `Someone left but couldn't be removed.`
          );
          socket.leave(trackRoomId);
        }
      });
    }
  });

  // Record score for user. TBD: time calculations

  socket.on("recordScore", (roomId, userId, value) => {
    console.log(value);
    postScore(roomId, userId, value, (result) => {
      if (result.modifiedCount > 0) {
        console.log("score recorded");
      } else {
        console.log("score not recorded");
      }
    });
  });

  // Start game, start cycling through questions
  socket.on("startGame", (roomId) => {
    findRoom(roomId.toUpperCase(), (result) => {
      io.to(roomId).emit(`gameStarted`, result);
      inSession(roomId, true, () => {});
      const gamePlay = (count, ms) =>
        new Promise((resolve) => {
          //console.log(count);

          const check = setInterval(() => {
            console.log("checker");
            findRoom(roomId.toUpperCase(), (result) => {
              if (result[0].answered === result[0].players.length) {
                console.log("all in", count);
                io.to(roomId).emit(`nextQuestion`, result, count);
                resolve();
                clearTimeout(timeOut);
                clearInterval(check);
                resetAnswered(roomId, () => {});
              }
            });
          }, 1500);

          const timeOut = setTimeout(() => {
            io.to(roomId).emit(`nextQuestion`, result, count);
            resetAnswered(roomId, () => {});
            resolve();
            clearInterval(check);
          }, ms);
          // if (count === NUM_QUES) {
          //   findRoom(roomId.toUpperCase(), (result) => {
          //     io.to(roomId).emit(`gameOver`, result);
          //     inSession(roomId, false, () => {});
          //   });
          //   clearInterval(check);
          //   clearTimeout(timeOut);
          //   resolve();
          // }
        });
      // let count = 0;
      // async function game() {
      //   while (count <= NUM_QUES) {
      //     await gamePlay(INTERVAL);
      //     count++;
      //   }
      // }
      async function game() {
        for (let count = 0; count <= NUM_QUES; count++) {
          if (count === NUM_QUES) {
            findRoom(roomId.toUpperCase(), (result) => {
              io.to(roomId).emit(`gameOver`, result);
              inSession(roomId, false, () => {});
            });
          } else {
            await gamePlay(count, INTERVAL);
          }
        }
      }

      game();
    });
  });

  // Restart the game for the same room
  socket.on("playAgain", (roomId, settings, token) => {
    resetRoom(roomId, settings, token, (result) => {
      if (result.modifiedCount > 0) {
        findRoom(roomId.toUpperCase(), (result) => {
          if (result[0].questions.length === 0) {
            io.to(roomId).emit(
              `gameEnded`,
              `Couldn't restart game since the category doesn't have enough questions.`
            );
            socket.leave(roomId);
          } else {
            io.to(roomId).emit(`waitingToStart`, result, NUM_QUES + 1);
          }
        });
      } else {
        io.to(roomId).emit(`gameEnded`, `couldn't restart room`);
        socket.leave(roomId);
      }
    });
  });
});

http.listen(PORT, () => {
  console.log(
    `Express seems to be listening on port ${PORT} so that's pretty good 👍`
  );
});
