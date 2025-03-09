require("dotenv").config();
const express = require("express");
const http = require("http");

const cors = require("cors");
const connectDB = require("./config/db");
const { initWebSocket, getIo } = require("./websocket/socket");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const server = http.createServer(app);
const path = require("path");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
connectDB();
initWebSocket(server);
app.use(session({
    secret: "tekup2025",
    resave: false,
    saveUninitialized: true
  }));
  app.use(flash());
  app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "routes", "views"));
app.use(express.static(path.join(__dirname, "public")));
// const isAuthenticated = (req, res, next) => {
  
//   // Get the token from cookies
//   const token =req.cookies.token;
//   if (!token) return res.redirect("/login");

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;  // Save user data to req.user
//     next();
//   } catch (err) {
//     return res.redirect("/login.faces");
//   }
// };
app.post("/send-notification", (req, res) => {
  const { message } = req.body;

  if (!message) {
      return res.status(400).json({ error: "Message is required" });
  }

  const io = getIo();
  io.emit("notification", { message });

  res.status(200).json({ success: true, message: "Notification sent!" });
});
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/taches", require("./routes/taskRoutes"));
app.use("/login.faces", require("./routes/controller/user/authroutes"));
app.use("/",require("./routes/controller/user/authroutes"));
app.use("/tasks", require("./routes/controller/task/taskRoutes"));
app.use("/admin.faces",require("./routes/controller/admin/user/authroutes"));
app.use("/admin.faces/tasks", require("./routes/controller/admin/task/taskRoutes"));
app.use("/app/api", require("./routes/controller/api/routes"));


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
