module.exports = (sequelize, Sequelize) => {
  const Log = sequelize.define("logs", {
    matricule: {
      type: Sequelize.STRING,
      allowNull: true
    },
    // username field removed
    model: {
      type: Sequelize.STRING,
      allowNull: false
    },
    action: {
      type: Sequelize.STRING, 
      allowNull: false
    },
    previousData: {
      type: Sequelize.JSON,
      allowNull: true
    },
    currentData: {
      type: Sequelize.JSON,
      allowNull: true
    },
    timestamp: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Log;
};
