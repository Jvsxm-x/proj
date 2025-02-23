const socketIo = require("socket.io");

let io;

const initWebSocket = (server) => {
  io = socketIo(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🟢 Nouvelle connexion WebSocket :", socket.id);

    socket.on("notification", (data) => {
      io.emit("notification", data);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Utilisateur déconnecté");
    });
  });

  return io;
};

module.exports = { initWebSocket, io: () => io };
