const express = require("express");
const jwt = require("jsonwebtoken"); // Import JWT
const Task = require("../../../models/Task");
const User = require("../../../models/user"); // Ensure correct import
const router = express.Router();
const { io } = require("socket.io-client");
const { default: mongoose } = require("mongoose");
const{sendNotificationToUser,sendNotificationToAll}=require("../../../websocket/socket")
const socket = io("ws://localhost:3000", { transports: ["websocket"] });

socket.on("connect", () => {
    console.log("✅ Connecté au serveur WebSocket !");
});

socket.on("notification", (data) => {
    console.log("📢 Notification reçue :", data);
});




// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect("/login");
    }
};

// Get all tasks for logged-in user
router.get("/", isAuthenticated,async (req, res) => {
    let noteffecttask;
noteffecttask = (await Task.find()
    .populate("utilisateur", "nom"))
    .filter(t => !t.utilisateur || !t.utilisateur.nom);
  
        const token=req.user;
        const tasks = await Task.find({ utilisateur: token.id }).populate("utilisateur", "nom");

        res.render("tasks/tasks", { tasks,       noteffecttask, user: req.user ,
            isAuthenticated });
   

});
router.delete("/delete/:id", async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).send({ error: "Error deleting task" });
    }
});
router.post("/delete/:id", async (req, res) => {
    try {
        const utilisateur=new  mongoose.Types.ObjectId();
        await Task.findByIdAndUpdate(req.params.id,{utilisateur});
        res.status(200).send({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).send({ error: "Error deleting task" });
    }
});
// Update task status via drag & drop
router.post("/update/:id",isAuthenticated, async (req, res) => {
    try {
        const { statut } = req.body;
        const utilisateur=req.user.id;
        await Task.findByIdAndUpdate(req.params.id, { statut ,utilisateur});
        sendNotificationToUser(req.user.id, ` FROM SOCKET Une stetus de  tâche "${statut}" a été Modifier.`);
        sendNotificationToAll(`FROM SOCKET: Une statut de tâche "${statut}" a été modifié.`);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

// Create new task (assign to logged-in user)
router.post("/create", isAuthenticated, async (req, res) => {
    try {
        const { titre, description, statut } = req.body;

        const newTask = new Task({
            titre,
            description,
            statut,
            utilisateur: req.user.id, // Assign task to logged-in user
        });
console.log(newTask);
        await newTask.save();

      //  socket.emit("notification", { message: `Nouvelle tâche créée : ${newTask.titre}` });
        sendNotificationToUser(req.user.id, `Une nouvelle tâche "${newTask.titre}" a été créée.`);

        res.status(201).json({ message: "Tâche créée avec succès", task: newTask });
    } catch (error) {
        console.error("Erreur de création de tâche :", error);
        res.status(500).json({ error: "Erreur lors de la création de la tâche" });
    }
});

// Middleware to make authentication status available in templates
router.use((req, res, next) => {
    res.locals.isAuthenticated = !!req.cookies.token;
    next();
});

module.exports = router;
