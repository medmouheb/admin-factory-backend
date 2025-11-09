module.exports = (sequelize, Sequelize) => {
  const Part = sequelize.define("parts", {
    learPN: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    tescaPN: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    desc: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    qtyPerBox: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return Part;
};
