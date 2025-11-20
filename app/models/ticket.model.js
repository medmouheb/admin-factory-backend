module.exports = (sequelize, Sequelize) => {
  const Ticket = sequelize.define("tickets", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    learPN: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    ticketCode: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    barcode: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    operateur: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });

  return Ticket;
};
