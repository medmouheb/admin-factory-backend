module.exports = (sequelize, Sequelize) => {
  const Ticket = sequelize.define("tickets", {


    ticketCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    barcode: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    },
  });

  return Ticket;
};
