module.exports = (sequelize, Sequelize) => {
  const Ticket = sequelize.define("tickets", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
  });

  return Ticket;
};
