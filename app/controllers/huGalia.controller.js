const db = require("../models");
const HuGalia = db.huGalia;
const Piece = db.piece;
const { Op } = require("sequelize");

// Create a new HuGalia with Pieces
exports.create = async (req, res) => {
    try {
        const { ticketCode, huGalia, quantity, status, location, createdBy, date, pieces } = req.body;

        const newHuGalia = {
            ticketCode,
            huGalia,
            quantity,
            status,
            location,
            createdBy,
            modifiedBy: createdBy,
            date: date || new Date(),
        };

        const result = await db.sequelize.transaction(async (t) => {
            const createdHuGalia = await HuGalia.create(newHuGalia, { transaction: t });

            if (pieces && pieces.length > 0) {
                const piecesData = pieces.map((p) => ({
                    ...p,
                    huGaliaId: createdHuGalia.id,
                }));
                await Piece.bulkCreate(piecesData, { transaction: t });
            }

            return createdHuGalia;
        });

        // Fetch the complete object with pieces to return
        const finalData = await HuGalia.findByPk(result.id, { include: ["pieces"] });
        res.status(201).json(finalData);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Some error occurred while creating the HuGalia.",
        });
    }
};

// Retrieve all HuGalias
exports.findAll = async (req, res) => {
    try {
        const { huGalia } = req.query;
        let condition = huGalia ? { huGalia: { [Op.like]: `%${huGalia}%` } } : null;

        const data = await HuGalia.findAll({ where: condition, include: ["pieces"] });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Some error occurred while retrieving HuGalias.",
        });
    }
};

// Find a single HuGalia by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await HuGalia.findByPk(id, { include: ["pieces"] });

        if (data) {
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: `Cannot find HuGalia with id=${id}.` });
        }
    } catch (error) {
        res.status(500).json({ message: "Error retrieving HuGalia with id=" + id });
    }
};

// Update a HuGalia
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { modifiedBy, pieces, ...updateData } = req.body;

        // Update HuGalia fields
        const [num] = await HuGalia.update({ ...updateData, modifiedBy }, { where: { id: id } });

        // If pieces are provided, we might need to update them too. 
        // For simplicity in this step, we'll just update the parent. 
        // Complex nested updates usually require more specific logic (add/remove/update).

        if (num == 1) {
            res.status(200).json({ message: "HuGalia was updated successfully." });
        } else {
            res.status(404).json({
                message: `Cannot update HuGalia with id=${id}. Maybe HuGalia was not found or req.body is empty!`,
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating HuGalia with id=" + id });
    }
};

// Delete a HuGalia
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const num = await HuGalia.destroy({ where: { id: id } });

        if (num == 1) {
            res.status(200).json({ message: "HuGalia was deleted successfully!" });
        } else {
            res.status(404).json({ message: `Cannot delete HuGalia with id=${id}. Maybe HuGalia was not found!` });
        }
    } catch (error) {
        res.status(500).json({ message: "Could not delete HuGalia with id=" + id });
    }
};
