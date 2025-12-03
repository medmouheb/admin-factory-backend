const db = require("../models");
const Material = db.material;
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");

// Create new material
exports.create = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).send(material);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all materials
exports.findAll = async (req, res) => {
  try {
    const materials = await Material.findAll();
    res.send(materials);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get material by ID
exports.findOne = async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    material ? res.send(material) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update material
exports.update = async (req, res) => {
  try {
    const [updated] = await Material.update(req.body, { where: { id: req.params.id } });
    updated ? res.send({ message: "Material updated successfully" }) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete material
exports.delete = async (req, res) => {
  try {
    const deleted = await Material.destroy({ where: { id: req.params.id } });
    deleted ? res.send({ message: "Material deleted" }) : res.status(404).send({ message: "Not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Search materials (by description or material code)
exports.search = async (req, res) => {
  try {
    const q = req.query.q || "";
    const materials = await Material.findAll({
      where: {
        [Op.or]: [
          { material: { [Op.like]: `%${q}%` } },
          { materialDescription: { [Op.like]: `%${q}%` } }
        ]
      }
    });
    res.send(materials);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get by material code
exports.getByMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({ where: { material: req.query.material } });
    material ? res.send(material) : res.status(404).send({ message: "Material not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};



exports.getByStoargeUnit = async (req, res) => {
  try {
    const material = await Material.findOne({ where: { storageUn: req.query.storageUn } });
    material ? res.send(material) : res.status(404).send({ message: "Material not found" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Export materials to Excel (filtered by date range)
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

    const materials = await Material.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] }
      },
      order: [["createdAt", "DESC"]]
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Materials");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Material", key: "material", width: 20 },
      { header: "Material Description", key: "materialDescription", width: 40 },
      { header: "Storage Unit", key: "storageUn", width: 20 },
      { header: "Available Stock", key: "availStock", width: 15 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 }
    ];

    // Add rows
    materials.forEach(material => {
      worksheet.addRow({
        id: material.id,
        material: material.material,
        materialDescription: material.materialDescription,
        storageUn: material.storageUn,
        availStock: material.availStock,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
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
      `attachment; filename=materials_${startDate}_to_${endDate}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).send({ message: err.message });
  }
};

// Import materials from Excel
exports.importFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    const materials = [];
    const errors = [];

    worksheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;

      try {
        const material = row.values[2]; // Column B
        const materialDescription = row.values[3]; // Column C
        const storageUn = row.values[4]; // Column D
        const availStock = row.values[5]; // Column E

        if (!material || !materialDescription || availStock === undefined) {
          errors.push(`Row ${rowNumber}: Missing required fields`);
          return;
        }

        materials.push({
          material,
          materialDescription,
          storageUn: storageUn || null,
          availStock: parseFloat(availStock)
        });
      } catch (err) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      }
    });

    if (materials.length === 0) {
      return res.status(400).send({ 
        message: "No valid materials found in the file",
        errors 
      });
    }

    // Bulk create materials
    const created = await Material.bulkCreate(materials, {
      validate: true,
      ignoreDuplicates: false
    });

    res.status(201).send({
      message: `Successfully imported ${created.length} materials`,
      imported: created.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).send({ message: err.message });
  }
};