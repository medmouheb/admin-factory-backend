const db = require("../models");
const User = db.user;
const Role = db.role;
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
    if (req.body.username !== undefined) payload.username = req.body.username;
    if (req.body.email !== undefined) payload.email = req.body.email;
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
    const { page = 1, size = 10, username = "", role = "" } = req.query;
    const limit = parseInt(size);
    const currentPage = parseInt(page);
    const offset = (currentPage - 1) * limit;

    const where = username ? { username: { [Op.like]: `%${username}%` } } : {};
    const include = role
      ? [{ model: Role, where: { name: role }, through: { attributes: [] }, required: true }]
      : [{ model: Role, through: { attributes: [] } }];

    const { rows, count } = await User.findAndCountAll({
      where,
      include,
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
