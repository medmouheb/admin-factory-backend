const db = require("../models");
const Ticket = db.ticket;
const TicketCode = db.ticketCode;
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");

// Export combined Ticket and TicketCode data to Excel (filtered by date range)
exports.exportCombinedToExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).send({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all tickets within the date range
    const tickets = await Ticket.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      order: [["createdAt", "DESC"]]
    });

    // Get all ticket codes
    const ticketCodes = await TicketCode.findAll();

    // Create a map of ticket codes for quick lookup
    const ticketCodeMap = {};
    ticketCodes.forEach(tc => {
      ticketCodeMap[tc.code] = tc;
    });

    // Combine the data
    const combinedData = tickets.map(ticket => {
      const ticketCodeData = ticketCodeMap[ticket.ticketCode] || {};
      return {
        ticketId: ticket.id,
        barcode: ticket.barcode,
        ticketCode: ticket.ticketCode,
        ticketCreatedAt: ticket.createdAt,
        ticketUpdatedAt: ticket.updatedAt,
        codeId: ticketCodeData.id || null,
        matricule: ticketCodeData.matricule || null,
        learPN: ticketCodeData.learPN || null,
        quantity: ticketCodeData.quantity || null,
        hu: ticketCodeData.hu || null,
        codeCreatedAt: ticketCodeData.createdAt || null,
        codeUpdatedAt: ticketCodeData.updatedAt || null
      };
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets and Codes");

    // Define columns
    worksheet.columns = [
      { header: "Ticket ID", key: "ticketId", width: 12 },
      { header: "Barcode", key: "barcode", width: 20 },
      { header: "Ticket Code", key: "ticketCode", width: 15 },
      { header: "Ticket Created At", key: "ticketCreatedAt", width: 20 },
      { header: "Ticket Updated At", key: "ticketUpdatedAt", width: 20 },
      { header: "Code ID", key: "codeId", width: 12 },
      { header: "Matricule", key: "matricule", width: 15 },
      { header: "Lear PN", key: "learPN", width: 20 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "HU", key: "hu", width: 20 },
      { header: "Code Created At", key: "codeCreatedAt", width: 20 },
      { header: "Code Updated At", key: "codeUpdatedAt", width: 20 }
    ];

    // Add rows
    combinedData.forEach(data => {
      worksheet.addRow(data);
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }
    };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=tickets_combined_${startDate}_to_${endDate}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).send({ message: err.message });
  }
};
