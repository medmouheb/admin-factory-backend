const db = require("../models");
const Ticket = db.ticket;
const { Op } = require("sequelize");
const { logAction } = require("../utils/logger");

// ✅ Create one Ticket
exports.create = async (req, res) => {
  try {
    const { ticketCode, barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: "barcode is required" });
    }

    const newTicket = await Ticket.create({ ticketCode, barcode });
    await logAction(req.userId, "Ticket", "CREATE", null, newTicket);
    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Create Ticket error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Barcode must be unique" });
    }
    res.status(500).json({ message: "Error creating Ticket", error: error.message });
  }
};

// ✅ Bulk create (list)
exports.bulkCreate = async (req, res) => {
  try {
    const tickets = req.body; // expecting an array of objects
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ message: "A non-empty array is required" });
    }

    // Validate data
    for (const t of tickets) {
      if (!t.barcode) {
        return res.status(400).json({ message: "Each ticket must have barcode" });
      }
    }

    const createdTickets = await Ticket.bulkCreate(tickets, { ignoreDuplicates: true });
    await logAction(req.userId, "Ticket", "BULK_CREATE", null, { count: createdTickets.length });
    res.status(201).json({
      message: `${createdTickets.length} tickets created successfully`,
      data: createdTickets,
    });
  } catch (error) {
    console.error("Bulk create Tickets error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Barcode must be unique" });
    }
    res.status(500).json({ message: "Error creating tickets", error: error.message });
  }
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
    const previous = await Ticket.findByPk(id);
    const deleted = await Ticket.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "Ticket not found" });
    await logAction(req.userId, "Ticket", "DELETE", previous, null);
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Ticket", error: error.message });
  }
};

// ✅ Check if barcode exists
exports.checkBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    if (!barcode) {
      return res.status(400).json({ message: "Barcode is required" });
    }

    const ticket = await Ticket.findOne({ where: { barcode } });

    if (ticket) {
      return res.status(200).json({ exists: true, ticket });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Check Barcode error:", error);
    res.status(500).json({ message: "Error checking barcode", error: error.message });
  }
};

// ✅ Update Ticket
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const previous = await Ticket.findByPk(id);
    const [updated] = await Ticket.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      const updatedTicket = await Ticket.findByPk(id);
      await logAction(req.userId, "Ticket", "UPDATE", previous, req.body);
      res.status(200).json(updatedTicket);
    } else {
      res.status(404).json({ message: "Ticket not found" });
    }
  } catch (error) {
    console.error("Update Ticket error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Barcode must be unique" });
    }
    res.status(500).json({ message: "Error updating Ticket", error: error.message });
  }
};

// ✅ Get Ticket by Barcode
exports.findByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const ticket = await Ticket.findOne({ where: { barcode } });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Find Ticket by Barcode error:", error);
    res.status(500).json({ message: "Error fetching Ticket", error: error.message });
  }
};
