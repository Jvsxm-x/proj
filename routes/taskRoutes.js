const express = require("express");
const Task = require("../models/Task");
const { getIo } = require("../websocket/socket");
const router = express.Router();
const { io } = require("socket.io-client");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const user = require("../models/user");

router.post("/", isAuthenticated, async (req, res) => {
  try {
      const user = req.user.id;
      console.log("Création d'une nouvelle tâche...");
      
      const task = new Task(req.body);
      task.utilisateur = user;
      await task.save();

      // Envoyer une notification WebSocket
   //   getIo().emit("taskCreated", { message: `Nouvelle tâche : ${task.titre}` });

      res.status(201).json(task);
  } catch (error) {
      console.error("Erreur lors de la création de la tâche :", error);
      res.status(500).json({ error: "Erreur lors de la création de la tâche" });
  }
});

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find();
    if (tasks.length > 0) {
      tasks.forEach(task => {
        socket.emit("notification", { message: 'Nouvelle tâche : ${task.titre} ' });
      });
    }
  res.status(200).json(tasks); 

   } catch(error){
    res.status(500).json({ error: "Erreur lors de la récupération des tâches" });
  }
  }

);

  router.put("/:id", async (req, res) => {
    try {
      const { titre, description, statut, dateEcheance } = req.body;
      let task = await Task.findById(req.params.id);
  
      if (!task) return res.status(404).json({ error: "Tâche non trouvée" });
      if (titre) task.titre = titre;
      if (description) task.description = description;
      if (statut) task.statut = statut;
      if (dateEcheance) task.dateEcheance = dateEcheance;

      await task.save();
  
      socket.emit("notification", { message: `Tâche mise à jour : ${task.titre}` });
  
      res.json({ message: "Tâche mise à jour", task });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const task = await Task.findByIdAndDelete(req.params.id);
  
      if (!task) return res.status(404).json({ error: "Tâche non trouvée" });
  
      socket.emit("notification", { message: `Tâche supprimée : ${task.titre}` });
  
      res.json({ message: "Tâche supprimée" });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // 🔓 Regular users can see their tasks
router.get("/tasks", isAuthenticated, async (req, res) => {
  try {
      const tasks = await Task.find({ utilisateur: req.user.id }); // Only user's tasks
      res.render("tasks", { tasks });
  } catch (error) {
      res.status(500).send("Erreur lors de la récupération des tâches");
  }
});

// 🔒 Managers & Admins can view all tasks
router.get("/all", isAuthenticated, authorizeRoles("admin", "manager"), async (req, res) => {
  try {
      const tasks = await Task.find();
      res.render("allTasks", { tasks });
  } catch (error) {
      res.status(500).send("Erreur lors de la récupération de toutes les tâches");
  }
});

// 🔒 Only Admins can delete tasks
router.post("/delete/:id", isAuthenticated, authorizeRoles("admin"), async (req, res) => {
  try {
      await Task.findByIdAndDelete(req.params.id);
      res.redirect("/tasks/all");
  } catch (error) {
      res.status(500).send("Erreur lors de la suppression de la tâche");
  }
});
module.exports = router;
