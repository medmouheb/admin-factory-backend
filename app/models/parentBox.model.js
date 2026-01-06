module.exports = (sequelize, Sequelize) => {
  const ParentBox = sequelize.define("parent_boxes", {
    ParentBoxCode: {
      type: Sequelize.STRING(50),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return ParentBox;
};
