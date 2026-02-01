const db = require("../models");
const Part = db.part;
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const { logAction } = require("../utils/logger");

// Create new part
exports.create = async (req, res) => {
  try {
    const part = await Part.create(req.body);
    await logAction(req.userId, "Part", "CREATE", null, part);
    res.status(201).send(part);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all parts
exports.findAll = async (req, res) => {
  try {
    const parts = await Part.findAll();
    res.send(parts);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get part by ID
exports.findOne = async (req, res) => {
  try {

    const part = await Part.findByPk(req.params.id);
    part ? res.send(part) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update part
exports.update = async (req, res) => {
  try {
    const previous = await Part.findByPk(req.params.id);
    const [updated] = await Part.update(req.body, { where: { id: req.params.id } });
    if (updated) {
       await logAction(req.userId, "Part", "UPDATE", previous, req.body);
       res.send({ message: "Part updated successfully" });
    } else {
       res.status(404).send({ message: "Not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete part
exports.delete = async (req, res) => {
  try {
    const previous = await Part.findByPk(req.params.id);
    const deleted = await Part.destroy({ where: { id: req.params.id } });
    if (deleted) {
      await logAction(req.userId, "Part", "DELETE", previous, null);
      res.send({ message: "Part deleted" });
    } else {
      res.status(404).send({ message: "Not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Search parts (by description or PN)
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: parts, count: totalItems } = await Part.findAndCountAll({
      where: {
        [Op.or]: [
          { learPN: { [Op.like]: `%${q}%` } },
          { tescaPN: { [Op.like] : `%${q}%` } },
          { desc: { [Op.like] : `%${q}%` } }
        ]
      },
      offset,
      limit
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.send({
      page,
      limit,
      totalItems,
      totalPages,
      data: parts
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get by LearPN
exports.getByLearPN = async (req, res) => {
  try {
    const part = await Part.findOne({ where: { learPN: req.query.learPN } });
    part ? res.send(part) : res.status(404).send({ message: "Part not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Export parts to Excel (filtered by date range)
exports.exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).send({ message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const parts = await Part.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      order: [["createdAt", "DESC"]]
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Parts");

    // Define columns
    worksheet.columns = [
      { header: "Lear PN", key: "learPN", width: 20 },
      { header: "Tesca PN", key: "tescaPN", width: 20 },
      { header: "Description", key: "desc", width: 40 },
      { header: "Qty Per Box", key: "qtyPerBox", width: 15 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 }
    ];

    // Add rows
    parts.forEach(part => {
      worksheet.addRow({
        learPN: part.learPN,
        tescaPN: part.tescaPN,
        desc: part.desc,
        qtyPerBox: part.qtyPerBox,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt
      });
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
      `attachment; filename=parts_${startDate}_to_${endDate}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).send({ message: err.message });
  }
};

// Import parts from Excel
exports.importFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const rowData = [];
    let colMap = {};

    worksheet.eachRow((row, rowNumber) => {
      // Handle header row
      if (rowNumber === 1) {
        row.values.forEach((value, index) => {
          if (typeof value === 'string') {
            const header = value.trim().toLowerCase();
            if (header.includes('lear') && header.includes('pn')) colMap.learPN = index;
            if (header.includes('tesca') && header.includes('pn')) colMap.tescaPN = index;
            if (header === 'description' || header === 'desc') colMap.desc = index;
            if (header.includes('qty') || header.includes('quantity')) colMap.qtyPerBox = index;
          }
        });
        return;
      }
      rowData.push({ rowNumber, values: row.values });
    });

    // Validate if required columns were found
    if (!colMap.learPN || !colMap.tescaPN || !colMap.desc || !colMap.qtyPerBox) {
        return res.status(400).send({ 
          message: "Invalid file format. Missing required columns: Lear PN, Tesca PN, Description, or Qty Per Box." 
        });
    }

    for (const { rowNumber, values } of rowData) {
      try {
        const learPN = values[colMap.learPN];
        const tescaPN = values[colMap.tescaPN];
        const desc = values[colMap.desc];
        const qtyPerBoxRaw = values[colMap.qtyPerBox];

        if (!learPN || !tescaPN || !desc || qtyPerBoxRaw === undefined) {
          throw new Error("Missing required fields (Lear PN, Tesca PN, Description, or Qty Per Box)");
        }

        const qtyPerBox = parseInt(qtyPerBoxRaw);
        if (isNaN(qtyPerBox)) {
          throw new Error(`Invalid Qty Per Box value: "${qtyPerBoxRaw}"`);
        }

        await Part.create({
          learPN,
          tescaPN,
          desc,
          qtyPerBox: qtyPerBox
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: ${err.message}`);
      }
    }

    if (results.success === 0 && results.errors.length > 0) {
      return res.status(400).send({
        message: "Failed to import parts. No valid rows were added.",
        results
      });
    }

    res.status(201).send({
      message: `Import complete. Added ${results.success} parts.`,
      results
    });

    await logAction(req.userId, "Part", "IMPORT", null, { success: results.success, failed: results.failed });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).send({ message: "An unexpected error occurred during import: " + err.message });
  }
};
