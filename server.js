require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const { initWebSocket } = require("./websocket/socket");

const app = express();
const server = http.createServer(app);

connectDB();
initWebSocket(server);

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/taches", require("./routes/taskRoutes"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
