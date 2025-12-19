module.exports = (sequelize, Sequelize) => {
  const BoxType = sequelize.define("boxtype", {
    code: {
      type: Sequelize.STRING,
      unique: true
    },
    description: {
      type: Sequelize.STRING
    }
  });

  return BoxType;
};
