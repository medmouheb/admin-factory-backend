module.exports = (sequelize, Sequelize) => {
  const BoxRequest = sequelize.define("box_request", {
    boxtypeCode: {
      type: Sequelize.STRING
    },
    matricule: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.ENUM('pending', 'validated', 'rejected'),
      defaultValue: 'pending'
    },
    demandNumber: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  });

  return BoxRequest;
};
