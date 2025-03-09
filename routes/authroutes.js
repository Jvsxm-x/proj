const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = express.Router();

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

// Modifier un utilisateur (nom, email, mot de passe)
router.put("/:id",  async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    if (nom) user.nom = nom;
    if (email) user.email = email;
    if (motDePasse) {
      const salt = await bcrypt.genSalt(10);
      user.motDePasse = await bcrypt.hash(motDePasse, salt);
    }

    await user.save();
    res.json({ message: "Utilisateur mis à jour", user });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// Supprimer un utilisateur
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    res.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});
module.exports = router;
