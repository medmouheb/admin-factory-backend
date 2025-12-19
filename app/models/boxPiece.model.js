module.exports = (sequelize, Sequelize) => {
  const BoxPiece = sequelize.define("box_piece", {
    idPiece: {
      type: Sequelize.STRING
    },
    count: {
      type: Sequelize.INTEGER
    }
  });

  return BoxPiece;
};
