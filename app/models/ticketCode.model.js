module.exports = (sequelize, Sequelize) => {
  const TicketCode = sequelize.define("ticket_codes", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: Sequelize.STRING(10),
      unique: true,
      allowNull: false,
    },
  });

  return TicketCode;
};
