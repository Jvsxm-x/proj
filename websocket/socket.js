// const socketIo = require("socket.io");

// let io;
// const users = new Map(); // Store users and their socket IDs

// const initWebSocket = (server) => {
//     if (!server) {
//         throw new Error("❌ Le serveur HTTP est requis pour initialiser Socket.io !");
//     }
    
//     io = socketIo(server, { cors: { origin: "*" } });

//     io.on("connection", (socket) => {
//         console.log("🟢 Nouvelle connexion WebSocket :", socket.id);

//         // Listen for user login and store their socket ID
//         socket.on("registerUser", (userId) => {
//             users.set(userId, socket.id);
//             console.log(`✅ Utilisateur ${userId} enregistré avec le socket ${socket.id}`);
//         });

//         socket.on("disconnect", () => {
//             users.forEach((value, key) => {
//                 if (value === socket.id) {
//                     users.delete(key);
//                     console.log(`🔴 Utilisateur ${key} déconnecté`);
//                 }
//             });
//         });
//     });

//     return io;
// };

// const getIo = () => {
//     if (!io) {
//         throw new Error("❌ Socket.io n'a pas été initialisé !");
//     }
//     return io;
// };

// // Send notification to a specific user
// const sendNotificationToUser = (userId, message) => {
//     const userSocketId = users.get(userId);
//     if (userSocketId) {
//         io.to(userSocketId).emit("user-notification", { message });
//         console.log(`📢 Notification envoyée à ${userId}: ${message}`);
//     } else {
//         console.log(`⚠️ L'utilisateur ${userId} n'est pas connecté`);
//     }
// };
// // When a status is updated
// const sendNotificationToAll = (message) => {
//     io.emit("admin-notification", { message });
// };


// module.exports = { initWebSocket, getIo, sendNotificationToUser,sendNotificationToAll };
const socketIo = require("socket.io");

let io;
const users = new Map(); // Stocke les utilisateurs et leurs sockets

const initWebSocket = (server) => {
    if (!server) {
        throw new Error("❌ Le serveur HTTP est requis pour initialiser Socket.io !");
    }
    
    io = socketIo(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
        console.log("🟢 Nouvelle connexion WebSocket :", socket.id);

        // Associer un utilisateur à son socket
        socket.on("registerUser", (userId) => {
            users.set(userId, socket.id);
            console.log(`✅ Utilisateur ${userId} enregistré avec le socket ${socket.id}`);
        });

        // Déconnexion
        socket.on("disconnect", () => {
            users.forEach((value, key) => {
                if (value === socket.id) {
                    users.delete(key);
                    console.log(`🔴 Utilisateur ${key} déconnecté`);
                }
            });
        });
    });

    return io;
};

// Obtenir l'instance de WebSocket
const getIo = () => {
    if (!io) {
        throw new Error("❌ Socket.io n'a pas été initialisé !");
    }
    return io;
};

// 📢 Envoyer une notification à un utilisateur spécifique
const sendNotificationToUser = (userId, message) => {
    const userSocketId = users.get(userId);
    if (userSocketId) {
        io.to(userSocketId).emit("user-notification", { message });
        console.log(`📢 Notification envoyée à ${userId}: ${message}`);
    } else {
        console.log(`⚠️ L'utilisateur ${userId} n'est pas connecté`);
    }
};

// 📢 Envoyer une notification à tous les utilisateurs
const sendNotificationToAll = (message) => {
    io.emit("admin-notification", { message });
};

module.exports = { initWebSocket, getIo, sendNotificationToUser, sendNotificationToAll };
