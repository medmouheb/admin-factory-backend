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
    matricule: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    learPN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    hu: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });

  return TicketCode;
};
