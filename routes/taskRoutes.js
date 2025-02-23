const express = require("express");
const Task = require("../models/Task");
const { io } = require("../websocket/socket");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    io().emit("notification", { message: `Nouvelle tâche : ${task.titre}` });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création de la tâche" });
  }
});
router.get("/", async (req, res) => {
    try {
const tasks = await Task.find().populate("user", "pseudo");   
   io().emit("notification", { message: `Nouvelle tâche : ${tasks[0].titre}` });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la création de la tâche" });
    }
  });

module.exports = router;
