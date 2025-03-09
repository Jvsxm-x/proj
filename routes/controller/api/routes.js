const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../../models/user");
const Task = require("../../../models/Task");
const Comment = require("../../../models/comment");
const router = express.Router();
const cron = require("node-cron");
const moment = require("moment");
const { isAuthenticated } = require("../../../middleware/auth");
const { getIo, sendNotificationToUser, sendNotificationToAll } = require("../../../websocket/socket");

// 📢 Envoi d'une notification à un utilisateur via WebSockets
router.post("/send", async (req, res) => {
    try {
        const { userId, title, body } = req.body;
        sendNotificationToUser(userId, `${title}: ${body}`);
        res.json({ message: "Notification envoyée via WebSockets" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📝 Inscription d'un utilisateur
router.post("/register", async (req, res) => {
    const { nom, email, motDePasse } = req.body;
    try {
        const utilisateur = new User({ nom, email, motDePasse });
        await utilisateur.save();
        res.status(201).json({ message: "Utilisateur créé !" });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
});

// 🔑 Connexion d'un utilisateur
router.post("/login", async (req, res) => {
    const { email, motDePasse } = req.body;
    try {
        const utilisateur = await User.findOne({ email });
        if (!utilisateur || !(await bcrypt.compare(motDePasse, utilisateur.motDePasse))) {
            return res.status(401).json({ error: "Identifiants invalides" });
        }
        const token = jwt.sign({ id: utilisateur._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Erreur de connexion" });
    }
});

// 📌 Attribution d'une tâche
router.patch("/tasks/:id/assign", async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const task = await Task.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true });

        if (!task) return res.status(404).json({ message: "Tâche non trouvée" });

        sendNotificationToUser(assignedTo, `Nouvelle tâche assignée : ${task.titre}`);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 💬 Ajout de commentaires à une tâche
router.post("/tasks/:id/comments", async (req, res) => {
    try {
        const token = req.cookies.token;

           const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
         req.user = decoded;
        const { content } = req.body;
        const comment = await Comment.create({ taskId: req.params.id, userId: req.user.id, content });

        sendNotificationToAll(`Nouveau commentaire sur la tâche ${req.params.id}`);
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Mise à jour du statut d'une tâche
router.patch("/tasks/:id/status", async (req, res) => {
    try {
        const { statut } = req.body;
        const task = await Task.findByIdAndUpdate(req.params.id, { statut }, { new: true });

        if (!task) return res.status(404).json({ message: "Tâche non trouvée" });

        sendNotificationToAll(`Statut de la tâche "${task.titre}" mis à jour : ${statut}`);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ⏰ Planification des rappels pour les tâches en retard
cron.schedule("0 * * * *", async () => {
    const now = moment();
    const tasks = await Task.find({ dueDate: { $lt: now.add(1, "hours") }, status: { $ne: "TERMINE" } });

    tasks.forEach(task => {
        sendNotificationToUser(task.utilisateur, `⚠️ Rappel : La tâche "${task.titre}" approche de l'échéance !`);
    });
});

// 📊 Dashboard
router.get("/dashboard", async (req, res) => {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    res.json({ totalTasks, completedTasks, pendingTasks });
});

module.exports = router;
