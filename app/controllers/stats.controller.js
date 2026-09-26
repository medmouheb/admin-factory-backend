const db = require("../models");
const Part = db.part;
const Material = db.material;
const User = db.user;
const Ticket = db.ticket;
const TicketCode = db.ticketCode;
const sequelize = db.sequelize;

exports.getPartsCountByDate = async (req, res) => {
  try {
    const data = await Part.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getMaterialsCountByDate = async (req, res) => {
  try {
    const data = await Material.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getTicketsCountByDate = async (req, res) => {
  try {
    const data = await Ticket.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getTicketCodesCountByDate = async (req, res) => {
  try {
    const data = await TicketCode.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getUsersByRole = async (req, res) => {
  try {
    const data = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getTicketCodesStatsByMatricule = async (req, res) => {
  try {
    // Group by matricule
    const data = await TicketCode.findAll({
      attributes: [
        'matricule',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['matricule'],
      where: {
        matricule: {
          [db.Sequelize.Op.ne]: null // Only count assigned ones, or remove this to see unassigned as null
        }
      }
    });
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const getStats = async (model) => {
      if (!model) return { total: 0, growth: 0 };
      
      const safeCount = async (where = {}) => {
         try {
            const result = await model.findAll({
               where,
               attributes: [
                  [sequelize.fn('COUNT', sequelize.col('id')), 'total']
               ],
               raw: true
            });
            // Result is [{ total: 5 }]
            return (result && result.length > 0) ? (parseInt(result[0].total, 10) || 0) : 0;
         } catch (error) {
            console.error("Count error:", error);
            return 0;
         }
      };

      const total = await safeCount();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const createdThisMonth = await safeCount({
          createdAt: {
            [db.Sequelize.Op.gte]: startOfMonth
          }
      });

      const totalStartOfMonth = total - createdThisMonth;
      let growth = 0;
      if (totalStartOfMonth > 0) {
        growth = (createdThisMonth / totalStartOfMonth) * 100;
      } else if (createdThisMonth > 0) {
        growth = 100;
      }
      
      return { total, growth: parseFloat(growth.toFixed(1)) };
    };

    const Ticket = db.ticket;
    const Piece = db.pieces; // Assuming 'pieces' is the model name in db object
    const User = db.user;
    const Material = db.material;
    
    // Parallel fetch
    const [ticketsStats, piecesStats, usersStats, materialsStats] = await Promise.all([
      getStats(Ticket),
      getStats(Piece),
      getStats(User),
      getStats(Material)
    ]);

    // Active Users (simplified as Total Users for now, or filter by 'isActive' if field exists)
    // The previous implementation used User.count().
    
    // Get recent activity (last 5 tickets)
    const recentTickets = await Ticket.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [] 
    });

    res.status(200).send({
      counts: {
        tickets: ticketsStats,
        pieces: piecesStats,
        users: usersStats,
        materials: materialsStats
      },
      recentActivity: recentTickets
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.getTicketCodesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'day' } = req.query;
    const where = {};
    const Op = db.Sequelize.Op;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.between]: [start, end]
      };
    } else if (startDate) {
      const start = new Date(startDate);
      where.createdAt = { [Op.gte]: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { [Op.lte]: end };
    }

    // 1. Summary
    const totalCount = await TicketCode.count({ where });
    const activeUsers = await TicketCode.count({
      where,
      distinct: true,
      col: 'matricule'
    });

    // 2. Shifts
    const shiftsData = await TicketCode.findAll({
      attributes: [
        [
          sequelize.literal(
            "SUM(CASE WHEN HOUR(createdAt) >= 6 AND HOUR(createdAt) < 14 THEN 1 ELSE 0 END)"
          ),
          "morning"
        ],
        [
          sequelize.literal(
            "SUM(CASE WHEN HOUR(createdAt) >= 14 AND HOUR(createdAt) < 22 THEN 1 ELSE 0 END)"
          ),
          "afternoon"
        ],
        [
          sequelize.literal(
            "SUM(CASE WHEN HOUR(createdAt) >= 22 OR HOUR(createdAt) < 6 THEN 1 ELSE 0 END)"
          ),
          "night"
        ]
      ],
      where,
      raw: true
    });

    const shifts = shiftsData[0] || { morning: 0, afternoon: 0, night: 0 };

    // 3. Chart Data
    let dateGroup;
    if (granularity === 'month') {
        dateGroup = sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m-01');
    } else {
        dateGroup = sequelize.fn('DATE', sequelize.col('createdAt'));
    }

    const chartDataRaw = await TicketCode.findAll({
      attributes: [
        [dateGroup, 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: [dateGroup],
      order: [[dateGroup, 'ASC']],
      raw: true
    });

    const chartData = chartDataRaw.map(item => ({
      date: item.date,
      count: parseInt(item.count, 10) || 0,
      errors: 0
    }));

    res.status(200).send({
      summary: {
        totalCount,
        activeUsers,
        averageTimeSeconds: 0
      },
      chartData,
      shifts: {
        morning: parseInt(shifts.morning, 10) || 0,
        afternoon: parseInt(shifts.afternoon, 10) || 0,
        night: parseInt(shifts.night, 10) || 0
      }
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ✅ Production Totals By Shift & By Operator
exports.getProductionByShift = async (req, res) => {
  try {
    const Op = db.Sequelize.Op;
    let selectedDate = req.query.date;

    // If no date supplied, find latest active date or use today
    if (!selectedDate) {
      const latestRecord = await TicketCode.findOne({
        attributes: ['createdAt'],
        order: [['createdAt', 'DESC']],
        raw: true
      });
      if (latestRecord && latestRecord.createdAt) {
        selectedDate = new Date(latestRecord.createdAt).toISOString().slice(0, 10);
      } else {
        selectedDate = new Date().toISOString().slice(0, 10);
      }
    }

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const where = {
      createdAt: { [Op.between]: [start, end] },
      matricule: { [Op.ne]: null }
    };

    const getShiftType = (dateObj) => {
      const h = new Date(dateObj).getHours();
      if (h >= 6 && h < 14) return "morning";
      if (h >= 14 && h < 22) return "afternoon";
      return "night";
    };

    // Fetch all ticket codes for the day
    const codes = await TicketCode.findAll({
      where,
      attributes: ["id", "code", "matricule", "hu", "learPN", "quantity", "createdAt"],
      order: [["createdAt", "ASC"]],
      raw: true
    });

    // Fetch users for names
    const users = await User.findAll({
      attributes: ["matricule", "firstName", "lastName", "role"],
      raw: true
    });
    const userMap = {};
    users.forEach(u => {
      if (u.matricule) userMap[u.matricule] = u;
    });

    // Recent dates with production activity
    const recentDatesRaw = await TicketCode.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'DESC']],
      limit: 10,
      raw: true
    });
    const availableDates = recentDatesRaw.map(r => ({
      date: r.date,
      count: parseInt(r.count, 10) || 0
    }));

    // Aggregate by shift & operator
    const shiftTotals = {
      morning: { key: "morning", name: "Matin", hours: "06h - 14h", tickets: 0, huCount: 0, totalQty: 0, ops: new Set(), color: "#0ea5e9" },
      afternoon: { key: "afternoon", name: "Après-midi", hours: "14h - 22h", tickets: 0, huCount: 0, totalQty: 0, ops: new Set(), color: "#f59e0b" },
      night: { key: "night", name: "Nuit", hours: "22h - 06h", tickets: 0, huCount: 0, totalQty: 0, ops: new Set(), color: "#8b5cf6" },
    };

    const operatorMap = {};

    codes.forEach(tc => {
      const shift = getShiftType(tc.createdAt);
      const mat = tc.matricule || "NON_ASSIGNE";
      const qty = parseInt(tc.quantity, 10) || 1;

      // Shift totals (1 HU = 1 T-Code)
      shiftTotals[shift].tickets += 1;
      shiftTotals[shift].huCount += 1;
      shiftTotals[shift].totalQty += qty;
      shiftTotals[shift].ops.add(mat);

      // Operator totals
      if (!operatorMap[mat]) {
        const u = userMap[mat] || {};
        operatorMap[mat] = {
          matricule: mat,
          operatorName: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : `Opérateur ${mat}`,
          role: u.role || 'operateur',
          morning: { tickets: 0, huCount: 0, qty: 0 },
          afternoon: { tickets: 0, huCount: 0, qty: 0 },
          night: { tickets: 0, huCount: 0, qty: 0 },
          totalTickets: 0,
          totalHU: 0,
          totalQty: 0
        };
      }

      operatorMap[mat][shift].tickets += 1;
      operatorMap[mat][shift].huCount += 1;
      operatorMap[mat][shift].qty += qty;

      operatorMap[mat].totalTickets += 1;
      operatorMap[mat].totalHU += 1;
      operatorMap[mat].totalQty += qty;
    });

    const totalProdDay = codes.length;

    const formattedShifts = [
      {
        key: "morning",
        name: "Matin",
        label: "Shift 1 — Matin (06:00 - 14:00)",
        hours: "06:00 - 14:00",
        tickets: shiftTotals.morning.tickets,
        huCount: shiftTotals.morning.tickets,
        totalQty: shiftTotals.morning.totalQty,
        operatorsCount: shiftTotals.morning.ops.size,
        percentage: totalProdDay > 0 ? Math.round((shiftTotals.morning.tickets / totalProdDay) * 100) : 0,
        color: "#0ea5e9",
        bgLight: "bg-sky-50 dark:bg-sky-950/30",
        borderColor: "border-sky-200 dark:border-sky-800"
      },
      {
        key: "afternoon",
        name: "Après-midi",
        label: "Shift 2 — Après-midi (14:00 - 22:00)",
        hours: "14:00 - 22:00",
        tickets: shiftTotals.afternoon.tickets,
        huCount: shiftTotals.afternoon.tickets,
        totalQty: shiftTotals.afternoon.totalQty,
        operatorsCount: shiftTotals.afternoon.ops.size,
        percentage: totalProdDay > 0 ? Math.round((shiftTotals.afternoon.tickets / totalProdDay) * 100) : 0,
        color: "#f59e0b",
        bgLight: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-800"
      },
      {
        key: "night",
        name: "Nuit",
        label: "Shift 3 — Nuit (22:00 - 06:00)",
        hours: "22:00 - 06:00",
        tickets: shiftTotals.night.tickets,
        huCount: shiftTotals.night.tickets,
        totalQty: shiftTotals.night.totalQty,
        operatorsCount: shiftTotals.night.ops.size,
        percentage: totalProdDay > 0 ? Math.round((shiftTotals.night.tickets / totalProdDay) * 100) : 0,
        color: "#8b5cf6",
        bgLight: "bg-purple-50 dark:bg-purple-950/30",
        borderColor: "border-purple-200 dark:border-purple-800"
      }
    ];

    const formattedOperators = Object.values(operatorMap).map(op => {
      // Find shift with max tickets
      let topShift = "morning";
      if (op.afternoon.tickets > op[topShift].tickets) topShift = "afternoon";
      if (op.night.tickets > op[topShift].tickets) topShift = "night";

      return {
        matricule: op.matricule,
        operatorName: op.operatorName,
        role: op.role,
        topShift,
        morning: {
          tickets: op.morning.tickets,
          huCount: op.morning.tickets,
          qty: op.morning.qty
        },
        afternoon: {
          tickets: op.afternoon.tickets,
          huCount: op.afternoon.tickets,
          qty: op.afternoon.qty
        },
        night: {
          tickets: op.night.tickets,
          huCount: op.night.tickets,
          qty: op.night.qty
        },
        totalTickets: op.totalTickets,
        totalHU: op.totalTickets,
        totalQty: op.totalQty,
        sharePercentage: totalProdDay > 0 ? Math.round((op.totalTickets / totalProdDay) * 100) : 0
      };
    }).sort((a, b) => b.totalTickets - a.totalTickets);

    const grandTotal = {
      date: selectedDate,
      totalTickets: totalProdDay,
      totalHU: totalProdDay,
      totalQty: formattedShifts.reduce((acc, s) => acc + s.totalQty, 0),
      totalOperators: formattedOperators.length
    };

    res.status(200).json({
      date: selectedDate,
      availableDates,
      grandTotal,
      shifts: formattedShifts,
      operators: formattedOperators
    });
  } catch (error) {
    console.error("Error in getProductionByShift:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

