const db = require("../models");
const ParentBox = db.parentBox;
const BoxPart = db.boxPart;
const { Op } = require("sequelize");
const { logAction } = require("../utils/logger");

// Create new ParentBox
exports.create = async (req, res) => {
  try {
    const { ParentBoxCode, description } = req.body;

    if (!ParentBoxCode) {
      return res.status(400).send({ message: "ParentBoxCode is required" });
    }

    // Check if code already exists
    const existing = await ParentBox.findByPk(ParentBoxCode);
    if (existing) {
      return res.status(400).send({ message: "ParentBoxCode already exists" });
    }

    const parentBox = await ParentBox.create({ ParentBoxCode, description });
    await logAction(req.userId, "ParentBox", "CREATE", null, parentBox);
    res.status(201).send(parentBox);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all ParentBoxes with their BoxParts
exports.findAll = async (req, res) => {
  try {
    const parentBoxes = await ParentBox.findAll({
      include: [
        {
          model: BoxPart,
          as: "boxParts",
        },
      ],
    });
    res.send(parentBoxes);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get ParentBox by ID
exports.findOne = async (req, res) => {
  try {
    const parentBox = await ParentBox.findByPk(req.params.id, {
      include: [
        {
          model: BoxPart,
          as: "boxParts",
        },
      ],
    });

    if (!parentBox) {
      return res.status(404).send({ message: "ParentBox not found" });
    }

    res.send(parentBox);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update ParentBox
exports.update = async (req, res) => {
  try {
    const previous = await ParentBox.findByPk(req.params.id);
    if (!previous) {
      return res.status(404).send({ message: "ParentBox not found" });
    }

    const [updated] = await ParentBox.update(req.body, {
      where: { ParentBoxCode: req.params.id },
    });

    if (updated) {
      await logAction(req.userId, "ParentBox", "UPDATE", previous, req.body);
      res.send({ message: "ParentBox updated successfully" });
    } else {
      res.status(404).send({ message: "ParentBox not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete ParentBox
exports.delete = async (req, res) => {
  try {
    const previous = await ParentBox.findByPk(req.params.id);
    if (!previous) {
      return res.status(404).send({ message: "ParentBox not found" });
    }

    const deleted = await ParentBox.destroy({
      where: { ParentBoxCode: req.params.id },
    });

    if (deleted) {
      await logAction(req.userId, "ParentBox", "DELETE", previous, null);
      res.send({ message: "ParentBox deleted successfully" });
    } else {
      res.status(404).send({ message: "ParentBox not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Search ParentBoxes by code or description
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: parentBoxes, count: totalItems } = await ParentBox.findAndCountAll({
      where: {
        [Op.or]: [
          { ParentBoxCode: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [
        {
          model: BoxPart,
          as: "boxParts",
        },
      ],
      offset,
      limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.send({
      page,
      limit,
      totalItems,
      totalPages,
      data: parentBoxes,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get ParentBox by ParentBoxCode
exports.getByCode = async (req, res) => {
  try {
    const parentBox = await ParentBox.findOne({
      where: { ParentBoxCode: req.params.code },
      include: [
        {
          model: BoxPart,
          as: "boxParts",
        },
      ],
    });

    if (!parentBox) {
      return res.status(404).send({ message: "ParentBox not found" });
    }

    res.send(parentBox);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
