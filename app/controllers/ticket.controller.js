const db = require("../models");
const Ticket = db.ticket;
const User = db.user;
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

// ✅ Create one Ticket
exports.create = async (req, res) => {
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
  jwt.verify(accessToken, config.secret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    try {
      const { learPN, ticketCode, barcode } = req.body;
      if (!learPN || !barcode) {
        return res.status(400).json({ message: "learPN and barcode are required" });
      }
      const user = await User.findByPk(decoded.id);
      const operateur = user ? user.username : null;
      const newTicket = await Ticket.create({ learPN, ticketCode, barcode, operateur });
      return res.status(201).json(newTicket);
    } catch (error) {
      console.error("Create Ticket error:", error);
      return res.status(500).json({ message: "Error creating Ticket", error: error.message });
    }
  });
};

// ✅ Bulk create (list)
exports.bulkCreate = async (req, res) => {
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
  jwt.verify(accessToken, config.secret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    try {
      const tickets = req.body;
      if (!Array.isArray(tickets) || tickets.length === 0) {
        return res.status(400).json({ message: "A non-empty array is required" });
      }
      for (const t of tickets) {
        if (!t.learPN || !t.barcode) {
          return res.status(400).json({ message: "Each ticket must have learPN and barcode" });
        }
      }
      const user = await User.findByPk(decoded.id);
      const operateur = user ? user.username : null;
      const createdTickets = await Ticket.bulkCreate(
        tickets.map((t) => ({ ...t, operateur })),
        { ignoreDuplicates: true }
      );
      return res.status(201).json({
        message: `${createdTickets.length} tickets created successfully`,
        data: createdTickets,
      });
    } catch (error) {
      console.error("Bulk create Tickets error:", error);
      return res.status(500).json({ message: "Error creating tickets", error: error.message });
    }
  });
};

// ✅ Get all Tickets
exports.findAll = async (req, res) => {
  try {
    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Search param
    const search = req.query.search || "";

    const whereClause = search
      ? {
          ticketCode: { [Op.like]: `%${search}%` },
        }
      : {};

    const { count, rows } = await Ticket.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching TicketCodes",
      error: error.message,
    });
  }
};
// ✅ Get one by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Ticket", error: error.message });
  }
};

// ✅ Delete one
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Ticket.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Ticket", error: error.message });
  }
};
