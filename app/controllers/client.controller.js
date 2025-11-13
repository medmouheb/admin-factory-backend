const db = require("../models");
const Client = db.client;
const { Op } = db.Sequelize;

/**
 * ➕ Create new client
 */
exports.create = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, latitude, longitude } = req.body;

    const client = await Client.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      latitude,
      longitude,
    });

    res.status(201).send(client);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * 📋 Get clients (active or archived) with pagination + search
 */
exports.findAll = async (req, res) => {
  try {
    const { page = 1, size = 10, search = "", archived = false } = req.query;

    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    const condition = {
      archived: archived === "true" ? true : false,
      [Op.or]: [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    };

    const data = await Client.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).send({
      totalItems: data.count,
      totalPages: Math.ceil(data.count / limit),
      currentPage: parseInt(page),
      clients: data.rows,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * 🔍 Get client by ID
 */
exports.findOne = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).send({ message: "Client not found" });
    res.send(client);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * ✏️ Update client info
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Client.update(req.body, { where: { id } });
    if (updated[0] === 1) res.send({ message: "Client updated successfully" });
    else res.status(404).send({ message: "Client not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/**
 * 🗄️ Archive (soft delete) client
 */
exports.archive = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);
    if (!client) return res.status(404).send({ message: "Client not found" });

    client.archived = true;
    await client.save();

    res.send({ message: "Client archived successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


exports.active = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);
    if (!client) return res.status(404).send({ message: "Client not found" });

    client.archived = false;
    await client.save();

    res.send({ message: "Client activated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
/**
 * ❌ Permanently delete archived client
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) return res.status(404).send({ message: "Client not found" });
    if (!client.archived) {
      return res
        .status(400)
        .send({ message: "Client must be archived before deletion" });
    }

    await client.destroy();
    res.send({ message: "Client permanently deleted" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
