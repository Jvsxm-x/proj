const express = require("express");
const jwt = require("jsonwebtoken"); // Import JWT
const Task = require("../../../../models/Task");
const User = require("../../../../models/user"); // Ensure correct import
const router = express.Router();
const { io } = require("socket.io-client");
const { default: mongoose } = require("mongoose");
const{sendNotificationToUser}=require("../../../../websocket/socket")
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
not = await Task.find()
    .populate("utilisateur", "nom");
  noteffecttask=not.filter(t=>!t.utilisateur || !t.utilisateur.nom);
        const token=req.user;
        const listtask = await Task.find().populate("utilisateur", "nom");
        const tasks = listtask.filter(t => t.utilisateur && t.utilisateur.nom !==null);
        console.log(tasks)
        res.render("admin/task/tasks", { tasks,       noteffecttask,
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
        sendNotificationToUser(req.user.id, `Une  tâche  a été supprimer.`);

        res.status(200).send({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).send({ error: "Error deleting étask" });
    }
});
// Update task status via drag & drop
router.post("/update/:id",isAuthenticated, async (req, res) => {
    try {
        const { statut } = req.body;
        const utilisateur=req.user.id;
        await Task.findByIdAndUpdate(req.params.id, { statut ,utilisateur});
        sendNotificationToUser(req.user.id, `Une update sur tâche  .`);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
    }
});

// Create new task (assign to logged-in user)
router.post("/create", isAuthenticated, async (req, res) => {
    try {
        const { titre, description, statut } = req.body;
        const u=new  mongoose.Types.ObjectId();

        const newTask = new Task({
            titre,
            description,
            statut,
            utilisateur:u, // Assign task to logged-in user
        });

        await newTask.save();

        socket.emit("notification", { message: `Nouvelle tâche créée : ${newTask.titre}` });
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
