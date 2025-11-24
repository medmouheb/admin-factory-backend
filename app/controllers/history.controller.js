const db = require("../models");
const History = db.history;
const User = db.user;

// Helper function to log history
exports.logHistory = async (userId, action, entity, entityId, details) => {
    try {
        await History.create({
            userId: userId,
            action: action,
            entity: entity,
            entityId: entityId ? String(entityId) : null,
            details: details ? JSON.stringify(details) : null
        });
        console.log(`History logged: ${action} on ${entity} ${entityId} by user ${userId}`);
    } catch (error) {
        console.error("Error logging history:", error);
    }
};

// Retrieve all History logs
exports.findAll = (req, res) => {
    History.findAll({
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "username", "email", "matricule"] // Include user info
            }
        ],
        order: [['timestamp', 'DESC']]
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving history."
            });
        });
};
