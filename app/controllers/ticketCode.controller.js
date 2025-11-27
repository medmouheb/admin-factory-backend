const db = require("../models");
const TicketCode = db.ticketCode;
const User = db.user;
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

// Helper function to generate random alphanumeric string of given length
function generateRandomAlphanumeric(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ✅ Create a new ticket code with user-provided last 5 characters
exports.createWithSuffix = async (req, res) => {
  try {
    const { suffix, learPN, quantity, hu } = req.body;

    if (!suffix || suffix.length !== 5) {
      return res.status(400).json({ message: "Suffix must be exactly 5 characters" });
    }

    const cookieHeader = req.headers["cookie"];
    let accessToken = null;
    if (cookieHeader) {
      const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => {
        const i = c.indexOf("=");
        const k = c.slice(0, i).trim();
        const v = decodeURIComponent(c.slice(i + 1).trim());
        return [k, v];
      }));
      accessToken = cookies.accessToken || null;
    }
    if (!accessToken) {
      const authHeader = req.headers["authorization"];
      accessToken = authHeader && authHeader.split(" ")[1];
    }
    if (!accessToken) {
      return res.status(401).json({ message: "Access token required" });
    }

    let matricule = null;
    jwt.verify(accessToken, config.secret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      const user = await User.findByPk(decoded.id);
      matricule = user ? user.matricule : null;

      let code;
      let exists = true;
      while (exists) {
        const randomPart = generateRandomAlphanumeric(5);
        code = randomPart + suffix.toUpperCase();
        const found = await TicketCode.findOne({ where: { code } });
        if (!found) exists = false;
      }

      const newTicketCode = await TicketCode.create({ 
        code, 
        matricule, 
        learPN, 
        quantity, 
        hu 
      });
      return res.status(201).json(newTicketCode);
    });
  } catch (error) {
    console.error("Error creating TicketCode:", error);
    res.status(500).json({ message: "Error creating TicketCode", error: error.message });
  }
};


//
// ✅ Search + Pagination
//
exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const hu = req.query.hu || "";
    const date = req.query.date || "";
    const time = req.query.time || "";
    const offset = (page - 1) * limit;

    const cookieHeader = req.headers["cookie"];
    let accessToken = null;
    if (cookieHeader) {
      const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => {
        const i = c.indexOf("=");
        const k = c.slice(0, i).trim();
        const v = decodeURIComponent(c.slice(i + 1).trim());
        return [k, v];
      }));
      accessToken = cookies.accessToken || null;
    }
    if (!accessToken) {
      const authHeader = req.headers["authorization"];
      accessToken = authHeader && authHeader.split(" ")[1];
    }

    let whereRole = {};
    if (accessToken) {
      await new Promise((resolve) => {
        jwt.verify(accessToken, config.secret, async (err, decoded) => {
          if (!err) {
            const user = await User.findByPk(decoded.id);
            // Check role attribute
            if (user.role === "operateur") {
              whereRole = { matricule: user.matricule };
            }
          }
          resolve();
        });
      });
    }

    const whereSearch = search ? { code: { [Op.like]: `%${search.toUpperCase()}%` } } : {};
    const whereHu = hu ? { hu: { [Op.like]: `%${hu}%` } } : {};

    let whereDate = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      if (time) {
        const [hours, minutes] = time.split(':');
        if (hours && minutes) {
          start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          end.setHours(parseInt(hours), parseInt(minutes), 59, 999);
        }
      }
      whereDate = { createdAt: { [Op.between]: [start, end] } };
    }

    const whereClause = { ...whereSearch, ...whereRole, ...whereHu, ...whereDate };

    const { rows: data, count: totalItems } = await TicketCode.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data,
    });
  } catch (error) {
    console.error("Error fetching TicketCodes:", error);
    res.status(500).json({ message: "Error fetching TicketCodes", error: error.message });
  }
};
