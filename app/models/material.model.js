module.exports = (sequelize, Sequelize) => {
  const Material = sequelize.define("materials", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    material: {
      type: Sequelize.STRING,
      allowNull: false
    },
    materialDescription: {
      type: Sequelize.STRING,
      allowNull: false
    },
    storageUn: {
      type: Sequelize.STRING,
      allowNull: true
    },
    availStock: {
      type: Sequelize.DECIMAL(10, 3), // e.g., 1500.000 or 92.000
      allowNull: false
    }
  });

  return Material;
};
