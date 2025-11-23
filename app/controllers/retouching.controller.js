const db = require("../models");
const Retouching = db.retouching;
const { Op } = require("sequelize");

// Create a new Retouching
exports.create = async (req, res) => {
    try {
        const { refLear, refTesca, huGalia, quantity, coiffeNumber, codeProblem, status } = req.body;

        const retouching = {
            refLear,
            refTesca,
            huGalia,
            quantity,
            coiffeNumber,
            codeProblem,
            status: status || "Non Réceptionne",
        };

        const data = await Retouching.create(retouching);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Some error occurred while creating the Retouching.",
        });
    }
};

// Retrieve all Retouchings
exports.findAll = async (req, res) => {
    try {
        const { refLear, huGalia } = req.query;
        let condition = {};

        if (refLear) {
            condition.refLear = { [Op.like]: `%${refLear}%` };
        }
        if (huGalia) {
            condition.huGalia = { [Op.like]: `%${huGalia}%` };
        }

        const data = await Retouching.findAll({ where: condition });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Some error occurred while retrieving retouchings.",
        });
    }
};

// Find a single Retouching by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Retouching.findByPk(id);

        if (data) {
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: `Cannot find Retouching with id=${id}.` });
        }
    } catch (error) {
        res.status(500).json({ message: "Error retrieving Retouching with id=" + id });
    }
};

// Update a Retouching
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const [num] = await Retouching.update(req.body, { where: { id: id } });

        if (num == 1) {
            res.status(200).json({ message: "Retouching was updated successfully." });
        } else {
            res.status(404).json({
                message: `Cannot update Retouching with id=${id}. Maybe Retouching was not found or req.body is empty!`,
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating Retouching with id=" + id });
    }
};

// Delete a Retouching
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const num = await Retouching.destroy({ where: { id: id } });

        if (num == 1) {
            res.status(200).json({ message: "Retouching was deleted successfully!" });
        } else {
            res.status(404).json({ message: `Cannot delete Retouching with id=${id}. Maybe Retouching was not found!` });
        }
    } catch (error) {
        res.status(500).json({ message: "Could not delete Retouching with id=" + id });
    }
};
