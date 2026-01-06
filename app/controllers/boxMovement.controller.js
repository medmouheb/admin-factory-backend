const db = require("../models");
const BoxMovement = db.boxMovement;
const BoxPart = db.boxPart;
const ParentBox = db.parentBox;
const { Op } = require("sequelize");
const { logAction } = require("../utils/logger");

// Helper function to update inventory based on movement
async function updateInventory(BoxPartsDemanded, movementType, transaction) {
  for (const item of BoxPartsDemanded) {
    const { BoxPartCode, demand } = item;

    if (!BoxPartCode || demand === undefined) {
      throw new Error("BoxPartCode and demand are required for each item");
    }

    const boxPart = await BoxPart.findByPk(BoxPartCode, { transaction });
    if (!boxPart) {
      throw new Error(`BoxPart with code ${BoxPartCode} not found`);
    }

    let newInventory;
    if (movementType === "add") {
      newInventory = boxPart.inventoryTotalNumber + demand;
    } else if (movementType === "subtract") {
      newInventory = boxPart.inventoryTotalNumber - demand;
      // Optional: prevent negative inventory
      if (newInventory < 0) {
        throw new Error(
          `Insufficient inventory for BoxPart ${BoxPartCode}. Current: ${boxPart.inventoryTotalNumber}, Requested: ${demand}`
        );
      }
    }

    await boxPart.update({ inventoryTotalNumber: newInventory }, { transaction });
  }
}

// Helper function to reverse inventory changes
async function reverseInventory(BoxPartsDemanded, movementType, transaction) {
  // Reverse the movement type
  const reversedType = movementType === "add" ? "subtract" : "add";
  await updateInventory(BoxPartsDemanded, reversedType, transaction);
}

// Create new BoxMovement
exports.create = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id, ParentBoxCode, movementType, BoxPartsDemanded } = req.body;

    // Validation
    if (!id) {
      await transaction.rollback();
      return res.status(400).send({ message: "id is required" });
    }

    if (!ParentBoxCode) {
      await transaction.rollback();
      return res.status(400).send({ message: "ParentBoxCode is required" });
    }

    if (!movementType || !["add", "subtract"].includes(movementType)) {
      await transaction.rollback();
      return res.status(400).send({ message: "movementType must be 'add' or 'subtract'" });
    }

    if (!BoxPartsDemanded || !Array.isArray(BoxPartsDemanded) || BoxPartsDemanded.length === 0) {
      await transaction.rollback();
      return res.status(400).send({ message: "BoxPartsDemanded must be a non-empty array" });
    }

    // Check if id already exists
    const existing = await BoxMovement.findByPk(id);
    if (existing) {
      await transaction.rollback();
      return res.status(400).send({ message: "BoxMovement id already exists" });
    }

    // Verify ParentBoxCode exists
    const parentBox = await ParentBox.findByPk(ParentBoxCode, { transaction });
    if (!parentBox) {
      await transaction.rollback();
      return res.status(400).send({ message: "ParentBoxCode does not exist" });
    }

    // Update inventory for all parts
    await updateInventory(BoxPartsDemanded, movementType, transaction);

    // Create the movement record
    const boxMovement = await BoxMovement.create(
      {
        id,
        ParentBoxCode,
        movementType,
        BoxPartsDemanded,
      },
      { transaction }
    );

    await transaction.commit();
    await logAction(req.userId, "BoxMovement", "CREATE", null, boxMovement);
    res.status(201).send(boxMovement);
  } catch (err) {
    await transaction.rollback();
    res.status(500).send({ message: err.message });
  }
};

// Get all BoxMovements
exports.findAll = async (req, res) => {
  try {
    const boxMovements = await BoxMovement.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.send(boxMovements);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get BoxMovement by ID
exports.findOne = async (req, res) => {
  try {
    const boxMovement = await BoxMovement.findByPk(req.params.id);

    if (!boxMovement) {
      return res.status(404).send({ message: "BoxMovement not found" });
    }

    res.send(boxMovement);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update BoxMovement
exports.update = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const previous = await BoxMovement.findByPk(req.params.id);
    if (!previous) {
      await transaction.rollback();
      return res.status(404).send({ message: "BoxMovement not found" });
    }

    // Reverse previous inventory changes
    await reverseInventory(previous.BoxPartsDemanded, previous.movementType, transaction);

    // Validate new movement type if changed
    if (req.body.movementType && !["add", "subtract"].includes(req.body.movementType)) {
      await transaction.rollback();
      return res.status(400).send({ message: "movementType must be 'add' or 'subtract'" });
    }

    // Validate ParentBoxCode if changed
    if (req.body.ParentBoxCode && req.body.ParentBoxCode !== previous.ParentBoxCode) {
      const parentBox = await ParentBox.findByPk(req.body.ParentBoxCode, { transaction });
      if (!parentBox) {
        await transaction.rollback();
        return res.status(400).send({ message: "ParentBoxCode does not exist" });
      }
    }

    const newMovementType = req.body.movementType || previous.movementType;
    const newBoxPartsDemanded = req.body.BoxPartsDemanded || previous.BoxPartsDemanded;

    // Apply new inventory changes
    await updateInventory(newBoxPartsDemanded, newMovementType, transaction);

    // Update the movement record
    const [updated] = await BoxMovement.update(req.body, {
      where: { id: req.params.id },
      transaction,
    });

    if (updated) {
      await transaction.commit();
      await logAction(req.userId, "BoxMovement", "UPDATE", previous, req.body);
      res.send({ message: "BoxMovement updated successfully" });
    } else {
      await transaction.rollback();
      res.status(404).send({ message: "BoxMovement not found" });
    }
  } catch (err) {
    await transaction.rollback();
    res.status(500).send({ message: err.message });
  }
};

// Delete BoxMovement
exports.delete = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const previous = await BoxMovement.findByPk(req.params.id);
    if (!previous) {
      await transaction.rollback();
      return res.status(404).send({ message: "BoxMovement not found" });
    }

    // Reverse inventory changes
    await reverseInventory(previous.BoxPartsDemanded, previous.movementType, transaction);

    const deleted = await BoxMovement.destroy({
      where: { id: req.params.id },
      transaction,
    });

    if (deleted) {
      await transaction.commit();
      await logAction(req.userId, "BoxMovement", "DELETE", previous, null);
      res.send({ message: "BoxMovement deleted successfully" });
    } else {
      await transaction.rollback();
      res.status(404).send({ message: "BoxMovement not found" });
    }
  } catch (err) {
    await transaction.rollback();
    res.status(500).send({ message: err.message });
  }
};

// Search BoxMovements
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: boxMovements, count: totalItems } = await BoxMovement.findAndCountAll({
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${q}%` } },
          { ParentBoxCode: { [Op.like]: `%${q}%` } },
        ],
      },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.send({
      page,
      limit,
      totalItems,
      totalPages,
      data: boxMovements,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get BoxMovements by ParentBoxCode
exports.getByParentBoxCode = async (req, res) => {
  try {
    const boxMovements = await BoxMovement.findAll({
      where: { ParentBoxCode: req.params.code },
      order: [["createdAt", "DESC"]],
    });

    res.send(boxMovements);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
