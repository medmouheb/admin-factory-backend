const db = require("../models");
const Part = db.part;
const { Op } = require("sequelize");

// Create new part
exports.create = async (req, res) => {
  try {
    const part = await Part.create(req.body);
    res.status(201).send(part);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all parts
exports.findAll = async (req, res) => {
  try {
    const parts = await Part.findAll();
    res.send(parts);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get part by ID
exports.findOne = async (req, res) => {
  try {

    const part = await Part.findByPk(req.params.learPN);
    part ? res.send(part) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update part
exports.update = async (req, res) => {
  try {
    const [updated] = await Part.update(req.body, { where: { id: req.params.id } });
    updated ? res.send({ message: "Part updated successfully" }) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete part
exports.delete = async (req, res) => {
  try {
    const deleted = await Part.destroy({ where: { id: req.params.id } });
    deleted ? res.send({ message: "Part deleted" }) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Search parts (by description or PN)
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const parts = await Part.findAll({
      where: {
        [Op.or]: [
          { learPN: { [Op.like]: `%${q}%` } },
          { tescaPN: { [Op.like]: `%${q}%` } },
          { desc: { [Op.like]: `%${q}%` } }
        ]
      }
    });
    res.send(parts);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get by LearPN
exports.getByLearPN = async (req, res) => {
  try {
    const part = await Part.findOne({ where: { learPN: req.query.learPN } });
    part ? res.send(part) : res.status(404).send({ message: "Part not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
