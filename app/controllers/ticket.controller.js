const db = require("../models");
const Ticket = db.ticket;

// ✅ Create one Ticket
exports.create = async (req, res) => {
  try {
    const { learPN, ticketCode, barcode } = req.body;

    if (!learPN || !barcode) {
      return res.status(400).json({ message: "learPN and barcode are required" });
    }

    const newTicket = await Ticket.create({ learPN, ticketCode, barcode });
    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Create Ticket error:", error);
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
      if (!t.learPN || !t.barcode) {
        return res.status(400).json({ message: "Each ticket must have learPN and barcode" });
      }
    }

    const createdTickets = await Ticket.bulkCreate(tickets, { ignoreDuplicates: true });
    res.status(201).json({
      message: `${createdTickets.length} tickets created successfully`,
      data: createdTickets,
    });
  } catch (error) {
    console.error("Bulk create Tickets error:", error);
    res.status(500).json({ message: "Error creating tickets", error: error.message });
  }
};

// ✅ Get all Tickets
exports.findAll = async (req, res) => {
  try {
    const tickets = await Ticket.findAll();
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Tickets", error: error.message });
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
