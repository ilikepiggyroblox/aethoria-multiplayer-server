const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

app.get("/", (req, res) => {
  res.send("Aethoria Multiplayer Server Running");
});

io.on("connection", (socket) => {
  const roomId = socket.handshake.query.room || "default";

  socket.join(roomId);

  if (!rooms[roomId]) {
    rooms[roomId] = {};
  }

  rooms[roomId][socket.id] = {
    id: socket.id,
    x: 1200,
    y: 1200,
    name: "Player"
  };

  io.to(roomId).emit("players", rooms[roomId]);

  socket.on("move", (data) => {
    if (!rooms[roomId][socket.id]) return;

    rooms[roomId][socket.id].x = data.x;
    rooms[roomId][socket.id].y = data.y;

    socket.to(roomId).emit("playerMoved", {
      id: socket.id,
      x: data.x,
      y: data.y
    });
  });

  socket.on("disconnect", () => {
    if (rooms[roomId]) {
      delete rooms[roomId][socket.id];
      io.to(roomId).emit("playerLeft", socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
