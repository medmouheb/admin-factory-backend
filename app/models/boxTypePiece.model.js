module.exports = (sequelize, Sequelize) => {
  const BoxTypePiece = sequelize.define("boxtype_piece", {
    refId: {
      type: Sequelize.STRING
    },
    description: {
      type: Sequelize.STRING
    },
    picture: {
      type: Sequelize.STRING
    },
    totalCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    demandNumber: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  });

  return BoxTypePiece;
};
