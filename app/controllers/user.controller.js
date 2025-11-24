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
    if (req.body.matricule !== undefined) payload.matricule = req.body.matricule;
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
    const { page = 1, size = 10, username = "", matricule = "", role = "" } = req.query;
    const limit = parseInt(size);
    const currentPage = parseInt(page);
    const offset = (currentPage - 1) * limit;

    const where = {};
    if (username) where.username = { [Op.like]: `%${username}%` };
    if (matricule) where.matricule = { [Op.like]: `%${matricule}%` };
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

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        attributes: ['id', 'name'],
        through: {
          attributes: []
        }
      }]
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const roles = user.roles.map((role) => "ROLE_" + role.name.toUpperCase());

    return res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      matricule: user.matricule,
      roles: roles,
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
          username: singleUser.username,
          email: singleUser.email,
          matricule: singleUser.matricule,
          password: bcrypt.hashSync(singleUser.password, 8),
        });

        if (singleUser.roles) {
          // Handle roles if they are objects or strings
          const roleNames = singleUser.roles.map(r => (typeof r === 'object' ? r.name : r));

          const roles = await Role.findAll({
            where: {
              name: {
                [Op.or]: roleNames
              }
            }
          });
          await user.setRoles(roles);
        } else {
          // Default role = 1 (user/operateur)
          await user.setRoles([1]);
        }
        results.push({ username: singleUser.username, status: "Success" });
      } catch (err) {
        results.push({ username: singleUser.username, status: "Failed", error: err.message });
      }
    }

    return res.status(201).send({ message: "Process completed", results });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};
