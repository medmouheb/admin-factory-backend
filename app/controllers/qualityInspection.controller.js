const db = require("../models");
const QualityInspection = db.qualityInspection;
const { Op } = require("sequelize");

// Create a new QualityInspection
exports.create = async (req, res) => {
    try {
        const { huGalia, quantity, uniquePieceCode, problemCode, operator } = req.body;

        // Logic to generate ticket if validation passes
        // For now, we assume if the request is made to create, it's the final step or we are saving the state.
        // The user said: "if it check all of the quality identified in the step one some ticket it will be build"

        // We'll generate a ticket barcode/code if status is Passed or if we decide it's passed.
        // Let's assume we create it as 'Passed' if no problemCode, or handle logic here.

        const timestamp = Date.now();
        const generatedTicketCode = `TKT-${timestamp}`;
        const generatedBarcode = `BAR-${huGalia}-${timestamp}`;

        const qualityInspection = {
            huGalia,
            quantity,
            uniquePieceCode,
            problemCode,
            operator,
            ticketCode: generatedTicketCode,
            ticketBarcode: generatedBarcode,
            status: problemCode ? "Failed" : "Passed", // Simple logic: if problem code exists, it failed? Or maybe it's just recorded.
        };

        const data = await QualityInspection.create(qualityInspection);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Some error occurred while creating the QualityInspection.",
        });
    }
};

// Retrieve all QualityInspections
exports.findAll = async (req, res) => {
    try {
        const { huGalia, operator } = req.query;
        let condition = {};

        if (huGalia) {
            condition.huGalia = { [Op.like]: `%${huGalia}%` };
        }
        if (operator) {
            condition.operator = { [Op.like]: `%${operator}%` };
        }

        const data = await QualityInspection.findAll({ where: condition });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Some error occurred while retrieving quality inspections.",
        });
    }
};

// Find a single QualityInspection by ID
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await QualityInspection.findByPk(id);

        if (data) {
            res.status(200).json(data);
        } else {
            res.status(404).json({ message: `Cannot find QualityInspection with id=${id}.` });
        }
    } catch (error) {
        res.status(500).json({ message: "Error retrieving QualityInspection with id=" + id });
    }
};

// Update a QualityInspection
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const [num] = await QualityInspection.update(req.body, { where: { id: id } });

        if (num == 1) {
            res.status(200).json({ message: "QualityInspection was updated successfully." });
        } else {
            res.status(404).json({
                message: `Cannot update QualityInspection with id=${id}. Maybe QualityInspection was not found or req.body is empty!`,
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating QualityInspection with id=" + id });
    }
};

// Delete a QualityInspection
exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const num = await QualityInspection.destroy({ where: { id: id } });

        if (num == 1) {
            res.status(200).json({ message: "QualityInspection was deleted successfully!" });
        } else {
            res.status(404).json({ message: `Cannot delete QualityInspection with id=${id}. Maybe QualityInspection was not found!` });
        }
    } catch (error) {
        res.status(500).json({ message: "Could not delete QualityInspection with id=" + id });
    }
};
