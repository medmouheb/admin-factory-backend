module.exports = (sequelize, Sequelize) => {
  const Piece = sequelize.define("pieces", {
    barcode: {
      type: Sequelize.STRING,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('OK', 'NOK', 'Retouched', 'Replaced'),
      defaultValue: 'OK'
    }
    // The foreign key 'packetId' will be added automatically when you define associations
  });

  return Piece;
};