const db = require("../models");
const BoxPart = db.boxPart;
const ParentBox = db.parentBox;
const { Op } = require("sequelize");
const { logAction } = require("../utils/logger");
const path = require("path");
const fs = require("fs");

// Create new BoxPart
exports.create = async (req, res) => {
  try {
    const { BoxPartCode, description, regularDemand, inventoryTotalNumber, ParentBoxCode } = req.body;

    if (!BoxPartCode) {
      return res.status(400).send({ message: "BoxPartCode is required" });
    }

    // Check if code already exists
    const existing = await BoxPart.findByPk(BoxPartCode);
    if (existing) {
      return res.status(400).send({ message: "BoxPartCode already exists" });
    }

    // Validate ParentBoxCode if provided
    if (ParentBoxCode) {
      const parentBox = await ParentBox.findByPk(ParentBoxCode);
      if (!parentBox) {
        return res.status(400).send({ message: "ParentBoxCode does not exist" });
      }
    }

    // Handle picture upload
    let picturePath = null;
    if (req.file) {
      picturePath = req.file.filename;
    }

    const boxPart = await BoxPart.create({
      BoxPartCode,
      description,
      picture: picturePath,
      regularDemand: regularDemand || 0,
      inventoryTotalNumber: inventoryTotalNumber || 0,
      ParentBoxCode,
    });

    await logAction(req.userId, "BoxPart", "CREATE", null, boxPart);
    res.status(201).send(boxPart);
  } catch (err) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads/boxpart-pictures", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).send({ message: err.message });
  }
};

// Get all BoxParts
exports.findAll = async (req, res) => {
  try {
    const boxParts = await BoxPart.findAll({
      include: [
        {
          model: ParentBox,
          as: "parentBox",
        },
      ],
    });
    res.send(boxParts);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get BoxPart by ID
exports.findOne = async (req, res) => {
  try {
    const boxPart = await BoxPart.findByPk(req.params.id, {
      include: [
        {
          model: ParentBox,
          as: "parentBox",
        },
      ],
    });

    if (!boxPart) {
      return res.status(404).send({ message: "BoxPart not found" });
    }

    res.send(boxPart);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update BoxPart
exports.update = async (req, res) => {
  try {
    const previous = await BoxPart.findByPk(req.params.id);
    if (!previous) {
      return res.status(404).send({ message: "BoxPart not found" });
    }

    // Validate ParentBoxCode if provided in update
    if (req.body.ParentBoxCode && req.body.ParentBoxCode !== previous.ParentBoxCode) {
      const parentBox = await ParentBox.findByPk(req.body.ParentBoxCode);
      if (!parentBox) {
        return res.status(400).send({ message: "ParentBoxCode does not exist" });
      }
    }

    // Handle new picture upload
    let updateData = { ...req.body };
    if (req.file) {
      // Delete old picture if exists
      if (previous.picture) {
        const oldFilePath = path.join(__dirname, "../uploads/boxpart-pictures", previous.picture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      updateData.picture = req.file.filename;
    }

    const [updated] = await BoxPart.update(updateData, {
      where: { BoxPartCode: req.params.id },
    });

    if (updated) {
      await logAction(req.userId, "BoxPart", "UPDATE", previous, updateData);
      res.send({ message: "BoxPart updated successfully" });
    } else {
      res.status(404).send({ message: "BoxPart not found" });
    }
  } catch (err) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads/boxpart-pictures", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).send({ message: err.message });
  }
};

// Delete BoxPart
exports.delete = async (req, res) => {
  try {
    const previous = await BoxPart.findByPk(req.params.id);
    if (!previous) {
      return res.status(404).send({ message: "BoxPart not found" });
    }

    // Delete picture file if exists
    if (previous.picture) {
      const filePath = path.join(__dirname, "../uploads/boxpart-pictures", previous.picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const deleted = await BoxPart.destroy({
      where: { BoxPartCode: req.params.id },
    });

    if (deleted) {
      await logAction(req.userId, "BoxPart", "DELETE", previous, null);
      res.send({ message: "BoxPart deleted successfully" });
    } else {
      res.status(404).send({ message: "BoxPart not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Search BoxParts by code or description
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: boxParts, count: totalItems } = await BoxPart.findAndCountAll({
      where: {
        [Op.or]: [
          { BoxPartCode: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [
        {
          model: ParentBox,
          as: "parentBox",
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
      data: boxParts,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get BoxPart by BoxPartCode
exports.getByCode = async (req, res) => {
  try {
    const boxPart = await BoxPart.findOne({
      where: { BoxPartCode: req.params.code },
      include: [
        {
          model: ParentBox,
          as: "parentBox",
        },
      ],
    });

    if (!boxPart) {
      return res.status(404).send({ message: "BoxPart not found" });
    }

    res.send(boxPart);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get BoxPart picture
exports.getPicture = async (req, res) => {
  try {
    const boxPart = await BoxPart.findOne({
      where: { BoxPartCode: req.params.code },
    });

    if (!boxPart) {
      return res.status(404).send({ message: "BoxPart not found" });
    }

    if (!boxPart.picture) {
      return res.status(404).send({ message: "No picture available for this BoxPart" });
    }

    const filePath = path.join(__dirname, "../uploads/boxpart-pictures", boxPart.picture);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: "Picture file not found" });
    }

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
