const db = require("../models");
const Log = db.log;
const User = db.user;
const { Op } = require("sequelize");

// Get all logs with pagination and filtering
exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { model, username, startDate, endDate } = req.query;

    let whereClause = {};

    // Filter by Model
    if (model) {
      whereClause.model = { [Op.like]: `%${model}%` };
    }

    // Filter by Matricule
    if (username) {
        whereClause.matricule = { [Op.like]: `%${username}%` };
    }

    // Filter by Date or Date Range
    if (startDate || endDate) {
      let dateCondition = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateCondition[Op.gte] = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateCondition[Op.lte] = end;
      }
      whereClause.timestamp = dateCondition;
    }

    const { rows: logs, count: totalItems } = await Log.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["timestamp", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "matricule", "firstName", "lastName", "role"]
        }
      ]
    });

    res.send({
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data: logs
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
