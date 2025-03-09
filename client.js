const { io } = require("socket.io-client");

const socket = io("ws://localhost:3000");

socket.on("connect", () => {
    console.log("🟢 Connecté au serveur WebSocket !");
    socket.emit("notification", { message: "Hello depuis le client !" });
});

socket.on("notification", (data) => {
    console.log("📢 Notification reçue :", data);
});

socket.on("disconnect", () => {
    console.log("🔴 Déconnecté du serveur WebSocket");
});
