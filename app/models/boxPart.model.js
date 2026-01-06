module.exports = (sequelize, Sequelize) => {
  const BoxPart = sequelize.define("box_parts", {
    BoxPartCode: {
      type: Sequelize.STRING(50),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    picture: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    regularDemand: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    inventoryTotalNumber: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ParentBoxCode: {
      type: Sequelize.STRING(50),
      allowNull: true,
      references: {
        model: 'parent_boxes',
        key: 'ParentBoxCode'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  });

  return BoxPart;
};
