module.exports = (sequelize, Sequelize) => {
  const Part = sequelize.define("parts", {
    sarbiaPN: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    learPN: {
      type: Sequelize.STRING,
      allowNull: true,
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
