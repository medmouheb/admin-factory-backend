const db = require("../models");
const User = db.user;
// const Role = db.role; // Removed
const { Op } = db.Sequelize;
const bcrypt = require("bcryptjs");

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = {};
    if (req.body.firstName !== undefined) payload.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) payload.lastName = req.body.lastName;
    if (req.body.phone !== undefined) payload.phone = req.body.phone;
    if (req.body.email !== undefined) payload.email = req.body.email;
    if (req.body.matricule !== undefined) payload.matricule = req.body.matricule;
    if (req.body.role !== undefined) payload.role = req.body.role;
    if (req.body.password !== undefined) payload.password = bcrypt.hashSync(req.body.password, 8);
    const [updated] = await User.update(payload, { where: { id } });
    if (updated === 1) {
      const user = await User.findByPk(id);
      return res.status(200).send(user);
    } else {
      return res.status(404).send({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await User.destroy({ where: { id } });
    if (deleted === 1) {
      return res.status(200).send({ message: "User deleted successfully" });
    } else {
      return res.status(404).send({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { page = 1, size = 10, matricule = "", role = "" } = req.query;
    const limit = parseInt(size);
    const currentPage = parseInt(page);
    const offset = (currentPage - 1) * limit;

    const where = {};
    if (matricule) where.matricule = { [Op.like]: `%${matricule}%` };
    if (role) where.role = role;

    const { rows, count } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return res.status(200).send({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage,
      users: rows,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.status(200).send({
      id: user.id,
      matricule: user.matricule,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const usersData = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const singleUser of usersData) {
      try {
        const user = await User.create({
          matricule: singleUser.matricule,
          firstName: singleUser.firstName,
          lastName: singleUser.lastName,
          phone: singleUser.phone,
          email: singleUser.email,
          password: bcrypt.hashSync(singleUser.password, 8),
          role: singleUser.role || "operateur"
        });

        results.push({ matricule: singleUser.matricule, status: "Success" });
      } catch (err) {
        results.push({ matricule: singleUser.matricule, status: "Failed", error: err.message });
      }
    }

    return res.status(201).send({ message: "Process completed", results });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};
