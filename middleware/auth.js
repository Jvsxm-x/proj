const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login.faces");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const data =  User.findById(req.user.id).select('-motDePasse');
        
        req.user = decoded;
        req.roles=data.roles; // Save user data to req.user
        res.locals.isAuthenticated = true; // Pass auth status to views
        next();
    } catch (err) {
        return res.redirect("/login.faces");
    }
};

// Middleware to check user roles
const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.redirect("/login.faces");

            // Check if user has at least one allowed role
            const hasRole = user.roles.some(role => allowedRoles.includes(role));
            if (!hasRole) {
                return res.status(403).send("⛔ Accès refusé !");
            }

            next();
        } catch (error) {
            res.status(500).send("Erreur d'accès.");
        }
    };
};

module.exports = { isAuthenticated, authorizeRoles };
