const db = require("../models");
const Material = db.material;
const { Op } = require("sequelize");

// Create new material
exports.create = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).send(material);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all materials
exports.findAll = async (req, res) => {
  try {
    const materials = await Material.findAll();
    res.send(materials);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get material by ID
exports.findOne = async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    material ? res.send(material) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update material
exports.update = async (req, res) => {
  try {
    const [updated] = await Material.update(req.body, { where: { id: req.params.id } });
    updated ? res.send({ message: "Material updated successfully" }) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete material
exports.delete = async (req, res) => {
  try {
    const deleted = await Material.destroy({ where: { id: req.params.id } });
    deleted ? res.send({ message: "Material deleted" }) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Search materials (by description or material code)
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const materials = await Material.findAll({
      where: {
        [Op.or]: [
          { material: { [Op.like]: `%${q}%` } },
          { materialDescription: { [Op.like]: `%${q}%` } }
        ]
      }
    });
    res.send(materials);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get by material code
exports.getByMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({ where: { material: req.query.material } });
    material ? res.send(material) : res.status(404).send({ message: "Material not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
