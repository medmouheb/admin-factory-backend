const db = require("../models");
const TicketCode = db.ticketCode;
const Ticket = db.ticket;
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");

/**
 * Calcule la plage de temps de production.
 *
 * Règle usine : la journée démarre à 22h (shift Nuit) et se termine à 22h le lendemain.
 *   Journée du 20/04 = 19/04 22:00:00 → 20/04 21:59:59
 *   Ordre des shifts : Nuit (22h→6h) → Matin (6h→14h) → Après-midi (14h→22h)
 *
 * Paramètres query :
 *   - type      : "shift" | "day" | "week" | "month"  (défaut: "day")
 *   - date      : "YYYY-MM-DD"  (défaut: aujourd'hui)
 *   - shift     : "night"(22h→6h) | "morning"(6h→14h) | "afternoon"(14h→22h)
 *   - weekStart : "YYYY-MM-DD" (lundi de la semaine, si type="week")
 *   - month     : "YYYY-MM"    (si type="month")
 */
function getDateRange(query) {
  const { type = "day", date, shift, weekStart, month } = query;
  const now = new Date();

  // ── Helpers ─────────────────────────────────────────────────────
  const makeDate = (base, h, m = 0, s = 0, ms = 0) => {
    const d = new Date(base);
    d.setHours(h, m, s, ms);
    return d;
  };

  // ── SHIFT ────────────────────────────────────────────────────────
  if (type === "shift") {
    const refDate = date ? new Date(date) : new Date(now);
    refDate.setHours(0, 0, 0, 0);

    if (shift === "morning") {
      // Matin : 06:00 → 13:59:59 (même jour)
      return {
        from:  makeDate(refDate, 6, 0, 0, 0),
        to:    makeDate(refDate, 13, 59, 59, 999),
        label: `Shift Matin – ${refDate.toLocaleDateString("fr-FR")}`,
      };
    }
    if (shift === "afternoon") {
      // Après-midi : 14:00 → 21:59:59 (même jour)
      return {
        from:  makeDate(refDate, 14, 0, 0, 0),
        to:    makeDate(refDate, 21, 59, 59, 999),
        label: `Shift Après-midi – ${refDate.toLocaleDateString("fr-FR")}`,
      };
    }
    // night (défaut) : 22:00 du jour sélectionné → 05:59:59 du lendemain
    const nightEnd = new Date(refDate);
    nightEnd.setDate(nightEnd.getDate() + 1);
    return {
      from:  makeDate(refDate, 22, 0, 0, 0),
      to:    makeDate(nightEnd, 5, 59, 59, 999),
      label: `Shift Nuit – ${refDate.toLocaleDateString("fr-FR")} 22h → ${nightEnd.toLocaleDateString("fr-FR")} 6h`,
    };
  }

  // ── DAY (22h→22h) ─────────────────────────────────────────────
  // "Journée du 20/04" = 19/04 22:00 → 20/04 21:59:59
  if (type === "day") {
    const refDay = date ? new Date(date) : new Date(now);
    refDay.setHours(0, 0, 0, 0);

    const prevDay = new Date(refDay);
    prevDay.setDate(prevDay.getDate() - 1);

    return {
      from:  makeDate(prevDay, 22, 0, 0, 0),   // veille 22:00
      to:    makeDate(refDay,  21, 59, 59, 999), // jour J 21:59:59
      label: `Journée du ${refDay.toLocaleDateString("fr-FR")}`,
    };
  }

  // ── WEEK (lundi 22h → dimanche 21:59) ─────────────────────────
  if (type === "week") {
    let monday;
    if (weekStart) {
      monday = new Date(weekStart);
      monday.setHours(0, 0, 0, 0);
    } else {
      monday = new Date(now);
      const day = monday.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(monday.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
    }

    // La semaine production démarre dimanche 22h (veille du lundi)
    const sundayBefore = new Date(monday);
    sundayBefore.setDate(sundayBefore.getDate() - 1);

    // Et se termine dimanche suivant à 21:59
    const sundayAfter = new Date(monday);
    sundayAfter.setDate(sundayAfter.getDate() + 6);

    return {
      from:  makeDate(sundayBefore, 22, 0, 0, 0),
      to:    makeDate(sundayAfter,  21, 59, 59, 999),
      label: `Semaine du ${monday.toLocaleDateString("fr-FR")} au ${sundayAfter.toLocaleDateString("fr-FR")}`,
    };
  }

  // ── MONTH ─────────────────────────────────────────────────────
  if (type === "month") {
    let year, mon;
    if (month) {
      [year, mon] = month.split("-").map(Number);
    } else {
      year = now.getFullYear();
      mon  = now.getMonth() + 1;
    }
    // Premier jour du mois → veille à 22h
    const firstDay = new Date(year, mon - 1, 1, 0, 0, 0, 0);
    const dayBeforeFirst = new Date(firstDay);
    dayBeforeFirst.setDate(dayBeforeFirst.getDate() - 1);

    // Dernier jour du mois → à 21:59:59
    const lastDay = new Date(year, mon, 0, 0, 0, 0, 0); // dernier jour du mois

    return {
      from:  makeDate(dayBeforeFirst, 22, 0, 0, 0),
      to:    makeDate(lastDay, 21, 59, 59, 999),
      label: `${firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
    };
  }

  // Fallback
  const refDay = date ? new Date(date) : new Date(now);
  refDay.setHours(0, 0, 0, 0);
  const prevDay = new Date(refDay);
  prevDay.setDate(prevDay.getDate() - 1);
  return {
    from:  makeDate(prevDay, 22, 0, 0, 0),
    to:    makeDate(refDay,  21, 59, 59, 999),
    label: `Journée du ${refDay.toLocaleDateString("fr-FR")}`,
  };
}


// ────────────────────────────────────────────────────────────────
// Helpers shift
// ────────────────────────────────────────────────────────────────

/**
 * Définition des 3 shifts avec leur 1ère heure
 * shiftStartH : heure de début (0-23)
 * firstEndH   : heure de fin de la 1ère heure (exclusive)
 * Pour la nuit : shiftStartH=22, firstEndH=23 (22:00→22:59)
 */
const SHIFT_DEFS = [
  { key: "Matin",       label: "06:00 → 13:59", color: "FF0EA5E9", shiftStartH: 6,  shiftEndH: 14, firstEndH: 7  },
  { key: "Après-midi",  label: "14:00 → 21:59", color: "FFF59E0B", shiftStartH: 14, shiftEndH: 22, firstEndH: 15 },
  { key: "Nuit",        label: "22:00 → 05:59", color: "FF8B5CF6", shiftStartH: 22, shiftEndH: 6,  firstEndH: 23 },
];

function getShiftKey(date) {
  const h = new Date(date).getHours();
  if (h >= 6 && h < 14)  return "Matin";
  if (h >= 14 && h < 22) return "Après-midi";
  return "Nuit";
}

function isFirstHour(date, shiftDef) {
  const h = new Date(date).getHours();
  const m = new Date(date).getMinutes();
  // La 1ère heure = shiftStartH:00 → shiftStartH:59
  return h === shiftDef.shiftStartH;
}

function buildShiftStats(ticketCodes) {
  const stats = {};
  SHIFT_DEFS.forEach((s) => {
    stats[s.key] = { ...s, nbHU: 0, nbPieces: 0, firstHourHU: 0, firstHourPieces: 0 };
  });

  ticketCodes.forEach((tc) => {
    if (!tc.createdAt) return;
    const shiftKey = getShiftKey(tc.createdAt);
    const def = SHIFT_DEFS.find((d) => d.key === shiftKey);
    if (!def) return;

    stats[shiftKey].nbHU += 1;
    stats[shiftKey].nbPieces += tc.quantity || 0;

    if (isFirstHour(tc.createdAt, def)) {
      stats[shiftKey].firstHourHU += 1;
      stats[shiftKey].firstHourPieces += tc.quantity || 0;
    }
  });

  return stats;
}

// ────────────────────────────────────────────────────────────────
// GET /api/production-export/preview
// Renvoie les données JSON (pour preview dans le modal)
// ────────────────────────────────────────────────────────────────
exports.preview = async (req, res) => {
  try {
    const { from, to, label } = getDateRange(req.query);

    const ticketCodes = await TicketCode.findAll({
      where: {
        createdAt: { [Op.between]: [from, to] },
      },
      include: [
        {
          model: Ticket,
          as: "tickets",
          attributes: ["id", "barcode", "createdAt"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Agrégation par matricule + learPN
    const summary = {};
    let totalHU = 0;
    let totalPieces = 0;

    ticketCodes.forEach((tc) => {
      const key = `${tc.matricule || "N/A"}__${tc.learPN || "N/A"}`;
      if (!summary[key]) {
        summary[key] = {
          matricule: tc.matricule || "N/A",
          learPN: tc.learPN || "N/A",
          hu: tc.hu || "N/A",
          nbHU: 0,
          nbPieces: 0,
        };
      }
      summary[key].nbHU += 1;
      summary[key].nbPieces += tc.quantity || 0;
      totalHU += 1;
      totalPieces += tc.quantity || 0;
    });

    // Stats par shift + 1ère heure
    const shiftStats = buildShiftStats(ticketCodes);

    res.json({
      label,
      from: from.toISOString(),
      to: to.toISOString(),
      totalHU,
      totalPieces,
      rows: Object.values(summary),
      shiftStats: Object.values(shiftStats).map((s) => ({
        key:              s.key,
        label:            s.label,
        nbHU:             s.nbHU,
        nbPieces:         s.nbPieces,
        firstHourHU:      s.firstHourHU,
        firstHourPieces:  s.firstHourPieces,
        firstHourLabel:   `${String(s.shiftStartH).padStart(2,"0")}:00 → ${String(s.shiftStartH).padStart(2,"0")}:59`,
      })),
    });
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────────────────────────────────────────────────────────────────
// GET /api/production-export/excel
// Génère et télécharge le fichier Excel
// ────────────────────────────────────────────────────────────────
exports.exportExcel = async (req, res) => {
  try {
    const { from, to, label } = getDateRange(req.query);

    const ticketCodes = await TicketCode.findAll({
      where: {
        createdAt: { [Op.between]: [from, to] },
      },
      include: [
        {
          model: Ticket,
          as: "tickets",
          attributes: ["id", "barcode", "createdAt"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Admin Factory";
    workbook.created = new Date();

    // ── Feuille 1 : Résumé ──────────────────────────────────────
    const summarySheet = workbook.addWorksheet("Résumé");

    // En-tête titre
    summarySheet.mergeCells("A1:F1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = `Production – ${label}`;
    titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(1).height = 36;

    // Info période
    summarySheet.mergeCells("A2:F2");
    const periodeCell = summarySheet.getCell("A2");
    periodeCell.value = `Période : ${from.toLocaleString("fr-FR")} → ${to.toLocaleString("fr-FR")}`;
    periodeCell.font = { italic: true, size: 11, color: { argb: "FF444444" } };
    periodeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EDF5" } };
    periodeCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(2).height = 22;

    summarySheet.addRow([]);

    // Colonnes du résumé
    const headerRow = summarySheet.addRow(["Matricule", "Référence (Lear PN)", "HU", "Nb HU", "Nb Pièces"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });
    summarySheet.getRow(4).height = 24;

    // Agrégation
    const summaryMap = {};
    let totalHU = 0;
    let totalPieces = 0;

    ticketCodes.forEach((tc) => {
      const key = `${tc.matricule || "N/A"}__${tc.learPN || "N/A"}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          matricule: tc.matricule || "N/A",
          learPN: tc.learPN || "N/A",
          hu: tc.hu || "N/A",
          nbHU: 0,
          nbPieces: 0,
        };
      }
      summaryMap[key].nbHU += 1;
      summaryMap[key].nbPieces += tc.quantity || 0;
      totalHU += 1;
      totalPieces += tc.quantity || 0;
    });

    let rowIdx = 5;
    Object.values(summaryMap).forEach((s, i) => {
      const r = summarySheet.addRow([s.matricule, s.learPN, s.hu, s.nbHU, s.nbPieces]);
      const bg = i % 2 === 0 ? "FFF0F4FF" : "FFFFFFFF";
      r.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
      rowIdx++;
    });

    // Ligne totaux
    const totalRow = summarySheet.addRow(["TOTAL", "", "", totalHU, totalPieces]);
    totalRow.eachCell((cell, col) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Largeur colonnes résumé
    summarySheet.columns = [
      { key: "a", width: 18 },
      { key: "b", width: 22 },
      { key: "c", width: 22 },
      { key: "d", width: 12 },
      { key: "e", width: 14 },
    ];

    // ── Feuille 2 : Détail des scans ────────────────────────────
    const detailSheet = workbook.addWorksheet("Détail des scans");

    detailSheet.mergeCells("A1:G1");
    const detailTitle = detailSheet.getCell("A1");
    detailTitle.value = `Détail des scans – ${label}`;
    detailTitle.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    detailTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    detailTitle.alignment = { horizontal: "center", vertical: "middle" };
    detailSheet.getRow(1).height = 32;

    detailSheet.addRow([]);

    const detailHeader = detailSheet.addRow([
      "Code Ticket", "Matricule", "Lear PN", "HU", "Quantité", "Barcode", "Date / Heure scan"
    ]);
    detailHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });
    detailSheet.getRow(3).height = 22;

    ticketCodes.forEach((tc, i) => {
      // Ligne principale du ticket code
      const mainRow = detailSheet.addRow([
        tc.code,
        tc.matricule || "N/A",
        tc.learPN || "N/A",
        tc.hu || "N/A",
        tc.quantity || 0,
        "",
        tc.createdAt ? new Date(tc.createdAt).toLocaleString("fr-FR") : "",
      ]);
      const bgMain = i % 2 === 0 ? "FFF0F4FF" : "FFFFFFFF";
      mainRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgMain } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      // Lignes barcodes (sous-tickets)
      if (tc.tickets && tc.tickets.length > 0) {
        tc.tickets.forEach((t) => {
          const subRow = detailSheet.addRow([
            "", "", "", "", "",
            t.barcode,
            t.createdAt ? new Date(t.createdAt).toLocaleString("fr-FR") : "",
          ]);
          subRow.eachCell((cell) => {
            cell.font = { color: { argb: "FF6B7280" }, size: 10 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              left: { style: "thin", color: { argb: "FFE5E7EB" } },
              bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
              right: { style: "thin", color: { argb: "FFE5E7EB" } },
            };
          });
        });
      }
    });

    detailSheet.columns = [
      { key: "a", width: 18 },
      { key: "b", width: 16 },
      { key: "c", width: 20 },
      { key: "d", width: 20 },
      { key: "e", width: 12 },
      { key: "f", width: 28 },
      { key: "g", width: 22 },
    ];

    // ── Feuille 3 : Stats par shift (avec 1ère heure) ────────────
    const shiftSheet = workbook.addWorksheet("Stats par shift");
    shiftSheet.mergeCells("A1:G1");
    const shiftTitle = shiftSheet.getCell("A1");
    shiftTitle.value = `Distribution par shift – ${label}`;
    shiftTitle.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    shiftTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    shiftTitle.alignment = { horizontal: "center", vertical: "middle" };
    shiftSheet.getRow(1).height = 32;

    shiftSheet.addRow([]);

    // Sous-titre séparateur « Shift complet »
    const shiftSubTitle = shiftSheet.addRow(["Shift", "Plage horaire", "Nb HU (total)", "Nb Pièces (total)", "1ère heure", "HU 1ère H", "Pièces 1ère H"]);
    shiftSubTitle.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });
    shiftSheet.getRow(3).height = 28;

    // Calculer les stats shift
    const shiftStats = buildShiftStats(ticketCodes);

    SHIFT_DEFS.forEach((def) => {
      const s = shiftStats[def.key];
      const firstHourLabel = `${String(def.shiftStartH).padStart(2,"0")}:00 → ${String(def.shiftStartH).padStart(2,"0")}:59`;
      const r = shiftSheet.addRow([
        def.key,
        def.label,
        s.nbHU,
        s.nbPieces,
        firstHourLabel,
        s.firstHourHU,
        s.firstHourPieces,
      ]);

      r.eachCell((cell, col) => {
        // Colonnes 1 = nom shift coloré
        if (col === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: def.color } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        }
        // Colonnes 6-7 = 1ère heure, fond orangé léger
        else if (col >= 5) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
          if (col >= 6) cell.font = { bold: true, color: { argb: "FFB45309" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        }
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top:    { style: "thin", color: { argb: "FFD1D5DB" } },
          left:   { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right:  { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    });

    // Ligne totaux
    const shiftTotalHU     = SHIFT_DEFS.reduce((a, d) => a + shiftStats[d.key].nbHU, 0);
    const shiftTotalPieces = SHIFT_DEFS.reduce((a, d) => a + shiftStats[d.key].nbPieces, 0);
    const shiftTotal1HHU   = SHIFT_DEFS.reduce((a, d) => a + shiftStats[d.key].firstHourHU, 0);
    const shiftTotal1HP    = SHIFT_DEFS.reduce((a, d) => a + shiftStats[d.key].firstHourPieces, 0);
    const shiftTotalRow = shiftSheet.addRow(["TOTAL", "", shiftTotalHU, shiftTotalPieces, "", shiftTotal1HHU, shiftTotal1HP]);
    shiftTotalRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    shiftSheet.columns = [
      { key: "a", width: 16 },
      { key: "b", width: 20 },
      { key: "c", width: 16 },
      { key: "d", width: 18 },
      { key: "e", width: 18 },
      { key: "f", width: 14 },
      { key: "g", width: 16 },
    ];

    // ── Envoi du fichier ─────────────────────────────────────────
    const safeLabel = label.replace(/[^a-zA-Z0-9\-_]/g, "_").substring(0, 60);
    const filename = `production_${safeLabel}_${Date.now()}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Excel error:", err);
    res.status(500).json({ message: err.message });
  }
};
