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
    const [
      partsCount,
      materialsCount,
      usersCount,
      ticketsCount,
      ticketCodesCount
    ] = await Promise.all([
      Part.count(),
      Material.count(),
      User.count(),
      Ticket.count(),
      TicketCode.count()
    ]);

    // Get recent activity (last 5 tickets)
    const recentTickets = await Ticket.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [] // Add relations if needed
    });

    res.status(200).send({
      counts: {
        parts: partsCount,
        materials: materialsCount,
        users: usersCount,
        tickets: ticketsCount,
        ticketCodes: ticketCodesCount
      },
      recentActivity: recentTickets
    });
  } catch (error) {
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
