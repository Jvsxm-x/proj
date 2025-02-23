const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: String,
  statut: { type: String, enum: ["EN_COURS", "TERMINE", "ANNULE"], default: "EN_COURS" },
  dateCreation: { type: Date, default: Date.now },
  dateEcheance: Date,
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Task", TaskSchema);
