const db = require("../models");
const TicketCode = db.ticketCode;
const User = db.user;
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const { logAction } = require("../utils/logger");
const ExcelJS = require("exceljs");
const { generateShiftChart, generateTopOperatorsChart } = require("../utils/chartGenerator");

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
      await logAction(decoded.id, "TicketCode", "CREATE", null, newTicketCode);
      return res.status(201).json(newTicketCode);
    });
  } catch (error) {
    console.error("Error creating TicketCode:", error);
    res.status(500).json({ message: "Error creating TicketCode", error: error.message });
  }
};


//
// ✅ Search + Pagination (optimized)
//
exports.findAll = async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(100, parseInt(req.query.limit) || 10);
    const search    = (req.query.search    || "").trim();
    const hu        = (req.query.hu        || "").trim();
    const matricule = (req.query.matricule || req.query.operator || "").trim();
    const learPN    = (req.query.learPN    || "").trim();
    const date      = req.query.date       || "";
    const sort      = req.query.sort === "asc" ? "ASC" : "DESC";
    const offset    = (page - 1) * limit;

    // --- Auth: resolve role filter from cookie/header token ---
    let whereRole = {};
    const cookieHeader = req.headers["cookie"] || "";
    let accessToken = null;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const i = c.indexOf("=");
          return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
        })
      );
      accessToken = cookies.accessToken || null;
    }
    if (!accessToken) {
      const authHeader = req.headers["authorization"];
      accessToken = authHeader && authHeader.split(" ")[1];
    }
    if (accessToken) {
      await new Promise((resolve) => {
        jwt.verify(accessToken, config.secret, async (err, decoded) => {
          if (!err && decoded) {
            const user = await User.findByPk(decoded.id, { attributes: ["role", "matricule"] });
            if (user && user.role === "operateur") {
              whereRole = { matricule: user.matricule };
            }
          }
          resolve();
        });
      });
    }

    // --- Build WHERE clause ---
    const whereClause = { ...whereRole };
    if (search)    whereClause.code      = { [Op.like]: `%${search.toUpperCase()}%` };
    if (hu)        whereClause.hu        = { [Op.like]: `%${hu}%` };
    if (matricule) whereClause.matricule = { [Op.like]: `%${matricule}%` };
    if (learPN)    whereClause.learPN    = { [Op.like]: `%${learPN}%` };
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end   = new Date(date); end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { [Op.between]: [start, end] };
    }

    // --- Single query: paginated ticket codes ---
    const { rows: data, count: totalItems } = await TicketCode.findAndCountAll({
      where:  whereClause,
      limit,
      offset,
      order:  [["createdAt", sort]],
      raw:    true,   // plain objects — faster serialization
    });

    // --- Batch ticket-count lookup in ONE query for the current page only ---
    let finalData = data;
    if (data.length > 0) {
      const codes = data.map((d) => d.code);
      const Ticket = db.ticket;

      const ticketCounts = await Ticket.findAll({
        attributes: [
          "ticketCode",
          [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "cnt"],
        ],
        where:  { ticketCode: { [Op.in]: codes } },
        group:  ["ticketCode"],
        raw:    true,
      });

      const countMap = {};
      ticketCounts.forEach((t) => { countMap[t.ticketCode] = parseInt(t.cnt || 0); });

      // Deduplicate by HU — keep entry with highest ticket count
      const huMap = {};
      data.forEach((item) => {
        const key = item.hu || `__NO_HU_${item.id}`;
        if (!huMap[key] || (countMap[item.code] || 0) > (countMap[huMap[key].code] || 0)) {
          huMap[key] = item;
        }
      });

      finalData = Object.values(huMap);
      // Restore sort order after dedup
      finalData.sort((a, b) =>
        sort === "DESC"
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt)
      );
    }

    const duplicatesRemoved   = data.length - finalData.length;
    const adjustedTotalItems  = Math.max(0, totalItems - duplicatesRemoved);

    res.json({
      page,
      limit,
      totalItems:  adjustedTotalItems,
      totalPages:  Math.ceil(adjustedTotalItems / limit),
      data:        finalData,
    });
  } catch (error) {
    console.error("Error fetching TicketCodes:", error);
    res.status(500).json({ message: "Error fetching TicketCodes", error: error.message });
  }
};

// ✅ Check if HU is unique
exports.checkHuUnique = async (req, res) => {
  try {
    const { hu } = req.query;

    if (!hu) {
      return res.status(400).json({ message: "HU parameter is required" });
    }

    const existingTicketCode = await TicketCode.findOne({ where: { hu } });

    res.json({
      hu,
      isUnique: !existingTicketCode,
      exists: !!existingTicketCode
    });
  } catch (error) {
    console.error("Error checking HU uniqueness:", error);
    res.status(500).json({ message: "Error checking HU uniqueness", error: error.message });
  }
};

// ✅ Update TicketCode
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const previous = await TicketCode.findByPk(id);
    const [updated] = await TicketCode.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      const updatedTicketCode = await TicketCode.findByPk(id);
      await logAction(req.userId, "TicketCode", "UPDATE", previous, updatedTicketCode);
      res.status(200).json(updatedTicketCode);
    } else {
      res.status(404).json({ message: "TicketCode not found" });
    }
  } catch (error) {
    console.error("Update TicketCode error:", error);
    res.status(500).json({ message: "Error updating TicketCode", error: error.message });
  }
};

// ✅ Delete TicketCode
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const previous = await TicketCode.findByPk(id);
    const deleted = await TicketCode.destroy({
      where: { id: id }
    });

    if (deleted) {
      await logAction(req.userId, "TicketCode", "DELETE", previous, null);
      res.status(200).json({ message: "TicketCode deleted successfully" });
    } else {
      res.status(404).json({ message: "TicketCode not found" });
    }
  } catch (error) {
    console.error("Delete TicketCode error:", error);
    res.status(500).json({ message: "Error deleting TicketCode", error: error.message });
  }
};

// Helper: Determine shift type and name from Date
function getShiftInfo(dateObj) {
  const h = new Date(dateObj).getHours();
  if (h >= 6 && h < 14) {
    return { key: "morning", name: "Shift Matin", hours: "06h00 - 14h00" };
  }
  if (h >= 14 && h < 22) {
    return { key: "afternoon", name: "Shift Après-midi", hours: "14h00 - 22h00" };
  }
  return { key: "night", name: "Shift Nuit", hours: "22h00 - 06h00" };
}

// ✅ Shift Report — journalized state per operator and shift for a given date
exports.shiftReport = async (req, res) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) {
      return res.status(400).json({ message: "date query parameter is required (YYYY-MM-DD)" });
    }

    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    // Fetch all ticket codes for the day
    const codes = await TicketCode.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      order: [["matricule", "ASC"], ["createdAt", "ASC"]],
      raw: true,
    });

    // Lookup users to get full names
    const users = await User.findAll({
      attributes: ["matricule", "firstName", "lastName"],
      raw: true,
    });
    const userMap = {};
    users.forEach((u) => {
      if (u.matricule) {
        userMap[u.matricule] = [u.firstName, u.lastName].filter(Boolean).join(" ");
      }
    });

    if (codes.length === 0) {
      return res.json({
        date: dateStr,
        summary: {
          totalOps: 0,
          totalCodes: 0,
          totalHU: 0,
          totalQty: 0,
          shifts: {
            morning: { name: "Shift Matin", hours: "06h00 - 14h00", tcodes: 0, hu: 0, qty: 0, opsCount: 0, percentage: 0 },
            afternoon: { name: "Shift Après-midi", hours: "14h00 - 22h00", tcodes: 0, hu: 0, qty: 0, opsCount: 0, percentage: 0 },
            night: { name: "Shift Nuit", hours: "22h00 - 06h00", tcodes: 0, hu: 0, qty: 0, opsCount: 0, percentage: 0 },
          },
        },
        data: [],
      });
    }

    // Shift aggregations
    const shiftTotals = {
      morning: { name: "Shift Matin", hours: "06h00 - 14h00", tcodes: 0, hu: 0, qty: 0, opsSet: new Set() },
      afternoon: { name: "Shift Après-midi", hours: "14h00 - 22h00", tcodes: 0, hu: 0, qty: 0, opsSet: new Set() },
      night: { name: "Shift Nuit", hours: "22h00 - 06h00", tcodes: 0, hu: 0, qty: 0, opsSet: new Set() },
    };

    let globalTotalQty = 0;

    // Group by operator (matricule)
    const grouped = {};
    codes.forEach((tc) => {
      const mat = tc.matricule || "UNKNOWN";
      if (!grouped[mat]) {
        grouped[mat] = {
          matricule: mat,
          name: userMap[mat] || "",
          codes: [],
          totalQty: 0,
          shifts: {
            morning: { tcodes: 0, hu: 0, qty: 0 },
            afternoon: { tcodes: 0, hu: 0, qty: 0 },
            night: { tcodes: 0, hu: 0, qty: 0 },
          },
        };
      }

      const shiftInfo = getShiftInfo(tc.createdAt);
      const shiftKey = shiftInfo.key;
      const qty = Number(tc.quantity) || 0;

      // Operator level (1 HU = 1 T-Code)
      grouped[mat].shifts[shiftKey].tcodes += 1;
      grouped[mat].shifts[shiftKey].hu += 1;
      grouped[mat].shifts[shiftKey].qty += qty;
      grouped[mat].totalQty += qty;
      globalTotalQty += qty;

      // Shift level
      shiftTotals[shiftKey].tcodes += 1;
      shiftTotals[shiftKey].hu += 1;
      shiftTotals[shiftKey].qty += qty;
      shiftTotals[shiftKey].opsSet.add(mat);

      grouped[mat].codes.push({
        code: tc.code,
        hu: tc.hu || "",
        learPN: tc.learPN || "",
        quantity: qty,
        createdAt: tc.createdAt,
        shift: shiftInfo.name,
        shiftKey: shiftKey,
      });
    });

    const totalCodesAll = codes.length;

    // Format operators list
    const data = Object.values(grouped)
      .map((op) => ({
        matricule: op.matricule,
        name: op.name,
        totalCodes: op.codes.length,
        totalHU: op.codes.length,
        totalQty: op.totalQty,
        sharePercentage: totalCodesAll > 0 ? Math.round((op.codes.length / totalCodesAll) * 100) : 0,
        shifts: {
          morning: { tcodes: op.shifts.morning.tcodes, hu: op.shifts.morning.tcodes, qty: op.shifts.morning.qty },
          afternoon: { tcodes: op.shifts.afternoon.tcodes, hu: op.shifts.afternoon.tcodes, qty: op.shifts.afternoon.qty },
          night: { tcodes: op.shifts.night.tcodes, hu: op.shifts.night.tcodes, qty: op.shifts.night.qty },
        },
        codes: op.codes,
      }))
      .sort((a, b) => b.totalCodes - a.totalCodes);

    // Format summary
    const summary = {
      totalOps: Object.keys(grouped).length,
      totalCodes: totalCodesAll,
      totalHU: totalCodesAll,
      totalQty: globalTotalQty,
      shifts: {
        morning: {
          name: shiftTotals.morning.name,
          hours: shiftTotals.morning.hours,
          tcodes: shiftTotals.morning.tcodes,
          hu: shiftTotals.morning.tcodes,
          qty: shiftTotals.morning.qty,
          opsCount: shiftTotals.morning.opsSet.size,
          percentage: totalCodesAll > 0 ? Math.round((shiftTotals.morning.tcodes / totalCodesAll) * 100) : 0,
        },
        afternoon: {
          name: shiftTotals.afternoon.name,
          hours: shiftTotals.afternoon.hours,
          tcodes: shiftTotals.afternoon.tcodes,
          hu: shiftTotals.afternoon.tcodes,
          qty: shiftTotals.afternoon.qty,
          opsCount: shiftTotals.afternoon.opsSet.size,
          percentage: totalCodesAll > 0 ? Math.round((shiftTotals.afternoon.tcodes / totalCodesAll) * 100) : 0,
        },
        night: {
          name: shiftTotals.night.name,
          hours: shiftTotals.night.hours,
          tcodes: shiftTotals.night.tcodes,
          hu: shiftTotals.night.tcodes,
          qty: shiftTotals.night.qty,
          opsCount: shiftTotals.night.opsSet.size,
          percentage: totalCodesAll > 0 ? Math.round((shiftTotals.night.tcodes / totalCodesAll) * 100) : 0,
        },
      },
    };

    res.json({ date: dateStr, summary, data });
  } catch (error) {
    console.error("Shift report error:", error);
    res.status(500).json({ message: "Error generating shift report", error: error.message });
  }
};

// ✅ Export Shift Report to Excel (with Shift stats & Chart sheet)
exports.shiftReportExcel = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const codes = await TicketCode.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      order: [["matricule", "ASC"], ["createdAt", "ASC"]],
      raw: true,
    });

    // Lookup users
    const users = await User.findAll({
      attributes: ["matricule", "firstName", "lastName"],
      raw: true,
    });
    const userMap = {};
    users.forEach((u) => {
      if (u.matricule) {
        userMap[u.matricule] = [u.firstName, u.lastName].filter(Boolean).join(" ");
      }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TESCA Factory System";
    workbook.created = new Date();

    // Aggregations
    const shiftTotals = {
      morning: { name: "Shift Matin", hours: "06h00 - 14h00", tcodes: 0, hu: 0, qty: 0, opsSet: new Set() },
      afternoon: { name: "Shift Après-midi", hours: "14h00 - 22h00", tcodes: 0, hu: 0, qty: 0, opsSet: new Set() },
      night: { name: "Shift Nuit", hours: "22h00 - 06h00", tcodes: 0, hu: 0, qty: 0, opsSet: new Set() },
    };

    let globalTotalQty = 0;
    const grouped = {};

    codes.forEach((tc) => {
      const mat = tc.matricule || "UNKNOWN";
      if (!grouped[mat]) {
        grouped[mat] = {
          matricule: mat,
          name: userMap[mat] || "",
          codes: [],
          totalQty: 0,
          shifts: {
            morning: { tcodes: 0, hu: 0, qty: 0 },
            afternoon: { tcodes: 0, hu: 0, qty: 0 },
            night: { tcodes: 0, hu: 0, qty: 0 },
          },
        };
      }

      const shiftInfo = getShiftInfo(tc.createdAt);
      const shiftKey = shiftInfo.key;
      const qty = Number(tc.quantity) || 0;

      // 1 HU = 1 T-Code
      grouped[mat].shifts[shiftKey].tcodes += 1;
      grouped[mat].shifts[shiftKey].hu += 1;
      grouped[mat].shifts[shiftKey].qty += qty;
      grouped[mat].totalQty += qty;
      globalTotalQty += qty;

      shiftTotals[shiftKey].tcodes += 1;
      shiftTotals[shiftKey].hu += 1;
      shiftTotals[shiftKey].qty += qty;
      shiftTotals[shiftKey].opsSet.add(mat);

      grouped[mat].codes.push({
        code: tc.code,
        hu: tc.hu || "",
        learPN: tc.learPN || "",
        quantity: qty,
        createdAt: tc.createdAt,
        shift: shiftInfo.name,
      });
    });

    const totalCodesAll = codes.length;
    const totalOpsAll = Object.keys(grouped).length;
    const operatorsList = Object.values(grouped)
      .map((op) => ({
        matricule: op.matricule,
        name: op.name,
        totalCodes: op.codes.length,
        totalHU: op.codes.length,
        totalQty: op.totalQty,
        sharePercentage: totalCodesAll > 0 ? Math.round((op.codes.length / totalCodesAll) * 100) : 0,
        shifts: {
          morning: { tcodes: op.shifts.morning.tcodes, hu: op.shifts.morning.tcodes, qty: op.shifts.morning.qty },
          afternoon: { tcodes: op.shifts.afternoon.tcodes, hu: op.shifts.afternoon.tcodes, qty: op.shifts.afternoon.qty },
          night: { tcodes: op.shifts.night.tcodes, hu: op.shifts.night.tcodes, qty: op.shifts.night.qty },
        },
      }))
      .sort((a, b) => b.totalCodes - a.totalCodes);

    // ──────────────────────────────────────────
    // Sheet 1: Synthèse & Statistiques par Shift
    // ──────────────────────────────────────────
    const summarySheet = workbook.addWorksheet("Synthèse & Statistiques");

    // Title Banner
    summarySheet.mergeCells("A1:L1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = `TESCA — SYNTHÈSE DE PRODUCTION DU ${dateStr}`;
    titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C1D95" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(1).height = 34;

    summarySheet.addRow([]); // Empty Row 2

    // KPI Summary Section
    summarySheet.mergeCells("A3:L3");
    const kpiTitle = summarySheet.getCell("A3");
    kpiTitle.value = "STATISTIQUES GÉNÉRALES DE PRODUCTION";
    kpiTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    kpiTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
    kpiTitle.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    summarySheet.getRow(3).height = 22;

    const kpiHeaders = ["Date Production", "Opérateurs Actifs", "Total T-Codes", "Total HU Préparés", "Total Pièces", "Shift Leader"];
    const kpiValues = [
      dateStr,
      totalOpsAll,
      totalCodesAll,
      totalCodesAll,
      globalTotalQty,
      shiftTotals.morning.tcodes >= shiftTotals.afternoon.tcodes && shiftTotals.morning.tcodes >= shiftTotals.night.tcodes
        ? `Matin (${shiftTotals.morning.tcodes})`
        : shiftTotals.afternoon.tcodes >= shiftTotals.night.tcodes
        ? `Après-midi (${shiftTotals.afternoon.tcodes})`
        : `Nuit (${shiftTotals.night.tcodes})`,
    ];

    const kpiRow1 = summarySheet.addRow(kpiHeaders);
    kpiRow1.height = 20;
    kpiRow1.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF475569" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    const kpiRow2 = summarySheet.addRow(kpiValues);
    kpiRow2.height = 24;
    kpiRow2.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF1E293B" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    summarySheet.addRow([]); // Empty Row 6

    // Table 1: Récapitulatif par Shift
    summarySheet.mergeCells("A7:G7");
    const shiftSecTitle = summarySheet.getCell("A7");
    shiftSecTitle.value = "RÉPARTITION DE LA PRODUCTION PAR SHIFT";
    shiftSecTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    shiftSecTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } };
    shiftSecTitle.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    summarySheet.getRow(7).height = 22;

    const shiftTableHeaders = ["Shift", "Plage Horaire", "Opérateurs Actifs", "T-Codes Préparés", "Total HU", "Total Pièces", "Part Production (%)"];
    const shiftHeaderRow = summarySheet.addRow(shiftTableHeaders);
    shiftHeaderRow.height = 22;
    shiftHeaderRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14B8A6" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    const shiftRowsData = [
      ["Shift 1 — Matin", "06h00 - 14h00", shiftTotals.morning.opsSet.size, shiftTotals.morning.tcodes, shiftTotals.morning.tcodes, shiftTotals.morning.qty, totalCodesAll > 0 ? `${Math.round((shiftTotals.morning.tcodes / totalCodesAll) * 100)}%` : "0%"],
      ["Shift 2 — Après-midi", "14h00 - 22h00", shiftTotals.afternoon.opsSet.size, shiftTotals.afternoon.tcodes, shiftTotals.afternoon.tcodes, shiftTotals.afternoon.qty, totalCodesAll > 0 ? `${Math.round((shiftTotals.afternoon.tcodes / totalCodesAll) * 100)}%` : "0%"],
      ["Shift 3 — Nuit", "22h00 - 06h00", shiftTotals.night.opsSet.size, shiftTotals.night.tcodes, shiftTotals.night.tcodes, shiftTotals.night.qty, totalCodesAll > 0 ? `${Math.round((shiftTotals.night.tcodes / totalCodesAll) * 100)}%` : "0%"],
    ];

    shiftRowsData.forEach((s) => {
      const r = summarySheet.addRow(s);
      r.height = 20;
      r.eachCell((cell, colNum) => {
        cell.alignment = { horizontal: colNum <= 2 ? "left" : "center", vertical: "middle" };
        cell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
      });
    });

    const shiftTotalRow = summarySheet.addRow([
      "TOTAL SHIFTS",
      "—",
      totalOpsAll,
      totalCodesAll,
      totalCodesAll,
      globalTotalQty,
      "100%",
    ]);
    shiftTotalRow.height = 22;
    shiftTotalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCFBF1" } };
      cell.border = { top: { style: "medium" }, bottom: { style: "double" } };
    });

    summarySheet.addRow([]); // Empty Row 13

    // Table 2: Tableau Détaillé par Opérateur & par Shift
    summarySheet.mergeCells("A14:L14");
    const opSecTitle = summarySheet.getCell("A14");
    opSecTitle.value = "DÉTAIL DE LA PRODUCTION PAR OPÉRATEUR ET PAR SHIFT";
    opSecTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    opSecTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
    opSecTitle.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    summarySheet.getRow(14).height = 22;

    const opHeaders = [
      "Matricule Opérateur",
      "Nom & Prénom",
      "Matin T-Codes",
      "Matin HU",
      "Après-midi T-Codes",
      "Après-midi HU",
      "Nuit T-Codes",
      "Nuit HU",
      "Total HU",
      "Total T-Codes",
      "Total Pièces",
      "Part Prod (%)",
    ];

    const opHeaderRow = summarySheet.addRow(opHeaders);
    opHeaderRow.height = 24;
    opHeaderRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8B5CF6" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    operatorsList.forEach((op, idx) => {
      const row = summarySheet.addRow([
        op.matricule,
        op.name || "—",
        op.shifts.morning.tcodes,
        op.shifts.morning.hu,
        op.shifts.afternoon.tcodes,
        op.shifts.afternoon.hu,
        op.shifts.night.tcodes,
        op.shifts.night.hu,
        op.totalHU,
        op.totalCodes,
        op.totalQty,
        `${op.sharePercentage}%`,
      ]);
      row.height = 20;

      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        });
      }

      row.eachCell((cell, colNum) => {
        cell.alignment = { horizontal: colNum <= 2 ? "left" : "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    });

    const opTotalRow = summarySheet.addRow([
      "TOTAL GÉNÉRAL",
      `${totalOpsAll} Opérateur(s)`,
      shiftTotals.morning.tcodes,
      shiftTotals.morning.tcodes,
      shiftTotals.afternoon.tcodes,
      shiftTotals.afternoon.tcodes,
      shiftTotals.night.tcodes,
      shiftTotals.night.tcodes,
      totalCodesAll,
      totalCodesAll,
      globalTotalQty,
      "100%",
    ]);
    opTotalRow.height = 22;
    opTotalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E8FF" } };
      cell.border = { top: { style: "medium" }, bottom: { style: "double" } };
    });

    summarySheet.columns = [
      { width: 22 },
      { width: 25 },
      { width: 14 },
      { width: 12 },
      { width: 18 },
      { width: 15 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
    ];

    // ──────────────────────────────────────────
    // Sheet 2: Graphiques & Visualisations (Requested Sheet)
    // ──────────────────────────────────────────
    const chartSheet = workbook.addWorksheet("Graphiques de Production");

    chartSheet.mergeCells("A1:N1");
    const chartTitleCell = chartSheet.getCell("A1");
    chartTitleCell.value = `TESCA — STATISTIQUES GRAPHIQUES DE PRODUCTION (${dateStr})`;
    chartTitleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    chartTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C1D95" } };
    chartTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    chartSheet.getRow(1).height = 34;

    try {
      // 1. Generate Shift Chart
      const shiftsForChart = [
        { name: "Shift Matin", hours: "06h00 - 14h00", tcodes: shiftTotals.morning.tcodes, hu: shiftTotals.morning.tcodes },
        { name: "Shift Après-midi", hours: "14h00 - 22h00", tcodes: shiftTotals.afternoon.tcodes, hu: shiftTotals.afternoon.tcodes },
        { name: "Shift Nuit", hours: "22h00 - 06h00", tcodes: shiftTotals.night.tcodes, hu: shiftTotals.night.tcodes },
      ];
      const shiftChartBuf = generateShiftChart(shiftsForChart, dateStr);
      const shiftImageId = workbook.addImage({
        buffer: shiftChartBuf,
        extension: "png",
      });
      chartSheet.addImage(shiftImageId, {
        tl: { col: 1, row: 3 },
        ext: { width: 880, height: 430 },
      });

      // 2. Generate Top Operators Chart
      const topOpsForChart = operatorsList.slice(0, 8);
      const topOpsChartBuf = generateTopOperatorsChart(topOpsForChart, dateStr);
      const topOpsImageId = workbook.addImage({
        buffer: topOpsChartBuf,
        extension: "png",
      });
      chartSheet.addImage(topOpsImageId, {
        tl: { col: 1, row: 26 },
        ext: { width: 880, height: 450 },
      });
    } catch (chartErr) {
      console.error("Error generating charts for Excel:", chartErr);
    }

    chartSheet.columns = [{ width: 4 }, { width: 30 }, { width: 25 }, { width: 20 }, { width: 20 }];

    // ──────────────────────────────────────────
    // Sheet 3: Détail des T-Codes et HU
    // ──────────────────────────────────────────
    const detailSheet = workbook.addWorksheet("Détail T-Codes");

    detailSheet.mergeCells("A1:G1");
    const detailTitleCell = detailSheet.getCell("A1");
    detailTitleCell.value = `TESCA — DÉTAIL DES T-CODES ET HU (${dateStr})`;
    detailTitleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    detailTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF581C87" } };
    detailTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    detailSheet.getRow(1).height = 32;

    detailSheet.addRow([]);

    const detailHeaders = ["Matricule", "Nom Opérateur", "T-Code", "HU", "Réf. LEAR", "Quantité", "Shift", "Date & Heure"];
    const detailHeaderRow = detailSheet.addRow(detailHeaders);
    detailHeaderRow.height = 24;
    detailHeaderRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    codes.forEach((tc, idx) => {
      const shiftInfo = getShiftInfo(tc.createdAt);
      const timeStr = tc.createdAt ? new Date(tc.createdAt).toLocaleTimeString("fr-FR") : "";
      const row = detailSheet.addRow([
        tc.matricule || "N/A",
        userMap[tc.matricule] || "—",
        tc.code,
        tc.hu || "",
        tc.learPN || "",
        tc.quantity != null ? tc.quantity : "",
        shiftInfo.name,
        timeStr,
      ]);
      row.height = 19;
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        });
      }
      row.eachCell((cell, colNum) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
        if (colNum >= 3 && colNum <= 7) cell.alignment = { horizontal: "center" };
      });
    });

    detailSheet.columns = [
      { width: 18 },
      { width: 24 },
      { width: 20 },
      { width: 22 },
      { width: 22 },
      { width: 14 },
      { width: 22 },
      { width: 18 },
    ];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=etat_shift_${dateStr}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Shift report Excel export error:", error);
    res.status(500).json({ message: "Erreur lors de l'export Excel", error: error.message });
  }
};


