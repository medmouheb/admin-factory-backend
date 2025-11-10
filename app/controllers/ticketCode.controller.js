const db = require("../models");
const TicketCode = db.ticketCode;

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
    const { suffix } = req.body;

    if (!suffix || suffix.length !== 5) {
      return res.status(400).json({ message: "Suffix must be exactly 5 characters" });
    }

    let code;
    let exists = true;

    // keep generating until unique
    while (exists) {
      const randomPart = generateRandomAlphanumeric(5); // first 5 chars alphanumeric
      code = randomPart + suffix.toUpperCase();

      const found = await TicketCode.findOne({ where: { code } });
      if (!found) exists = false;
    }

    const newTicketCode = await TicketCode.create({ code });
    res.status(201).json(newTicketCode);
  } catch (error) {
    console.error("Error creating TicketCode:", error);
    res.status(500).json({ message: "Error creating TicketCode", error: error.message });
  }
};
