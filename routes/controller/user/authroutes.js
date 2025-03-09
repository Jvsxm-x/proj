const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../../models/user");
const router = express.Router();
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const Task = require("../../../models/Task");
const { authorizeRoles } = require("../../../middleware/auth");

router.use(cookieParser());
router.use(flash());

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to request
        res.locals.isAuthenticated = true; // Pass authentication state to views
        next();
    } catch (err) {
        return res.redirect("/login");
    }
};
//verification lo/verify/token decode etat 

router.get("/services", (req, res) => {
  const userAuthenticated = req.cookies.token ? true : false; 
  res.render("partials/service",{isAuthenticated:userAuthenticated});  // Render the service.ejs page
});
// Middleware to set isAuthenticated flag in all views
router.use((req, res, next) => {
    res.locals.isAuthenticated = !!req.cookies.token;
    next();
});

// Render Home Page
router.get("/", (req, res) => {
  res.render("index", { error: req.flash("error") });
});

// Render Login Page
router.get("/login", (req, res) => {
  res.render("login", { error: req.flash("error") });
});

// Render Register Page
router.get("/register", (req, res) => {
  res.render("register", { message: req.flash("message"), error: req.flash("error") });
});

// Handle User Registration
router.post("/register", async (req, res) => {
  const { nom, email, motDePasse } = req.body;
  try {
      const utilisateur = new User({ nom, email, motDePasse });
      await utilisateur.save();
      req.flash("message", "Compte créé avec succès ! Connectez-vous.");
      res.redirect("/login");
  } catch (error) {
      req.flash("error", "Erreur lors de l'inscription");
      res.redirect("/register");
  }
});

// Handle User Login
router.post("/login", async (req, res) => {
  const { email, motDePasse } = req.body;
  try {
      const utilisateur = await User.findOne({ email });
      if (!utilisateur || !(await bcrypt.compare(motDePasse, utilisateur.motDePasse))) {
          req.flash("error", "Identifiants invalides");
          return res.redirect("/login");
      }

      // Create JWT token
      const token = jwt.sign({ id: utilisateur._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      // Set token in cookie
      res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000, // 1 hour
          sameSite: "Strict",
      });

      res.redirect("/profile");
  } catch (error) {
      req.flash("error", "Erreur de connexion");
      res.redirect("/login");
  }
});

// Render Profile Page (Protected)
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      res.render("profile", { user });
  } catch (error) {
      res.status(500).send("Erreur lors de la récupération du profil");
  }
});

// Render Update Profile Page (Protected)
router.get("/update-profile", isAuthenticated, async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      res.render("updateProfile", { user });
  } catch (error) {
      res.status(500).send("Erreur lors de la récupération du profil");
  }
});

// Handle Profile Update (Protected)
router.post("/update-profile", isAuthenticated, async (req, res) => {
  const { nom, email } = req.body;
  try {
      const user = await User.findById(req.user.id);
      user.nom = nom || user.nom;
      user.email = email || user.email;
      await user.save();
      res.redirect("/profile");
  } catch (error) {
      res.status(500).send("Erreur lors de la mise à jour du profil");
  }
});

// Render Dashboard Page
router.get("/dashboard", isAuthenticated, async (req, res) => {
  res.render("partials/dashboard", { message: req.flash("message"), error: req.flash("error") });
});

// API Route for Dashboard Statistics
router.get("/dashboard/data", isAuthenticated, async (req, res) => {
  let allTasks;
  let noteffecttask;

  const user = await User.findById(req.user.id).select("-motDePasse");
  try {
    if (user.roles.includes("admin")) {
      allTasks = await Task.find().populate("utilisateur", "nom");
    } else {
      allTasks = await Task.find({ utilisateur: req.user.id }).populate("utilisateur", "nom");
    }
    noteffecttask = (await Task.find()
    .populate("utilisateur", "nom"))
    .filter(t => !t.utilisateur || !t.utilisateur.nom);
  
    console.log(noteffecttask)
    const tasks = await Task.find({ utilisateur: req.user.id });
  
    

    const TotalTaskCompleted = tasks.length;
    const TotalTask = tasks.filter((task) => task.statut === "EN_COURS").length;
    const TotalTaskDone = tasks.filter((task) => task.statut === "TERMINE").length;
    const TotalTaskCancelled = tasks.filter((task) => task.statut === "ANNULE").length;

    res.json({
      noteffecttask,
      allTasks,
      TotalTaskCompleted,
      TotalTask,
      TotalTaskDone,
      TotalTaskCancelled,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
  }
});
// Logout User
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // Remove JWT cookie
  res.redirect("/login");
});

module.exports = router;
