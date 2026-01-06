module.exports = (sequelize, Sequelize) => {
  const BoxMovement = sequelize.define("box_movements", {
    id: {
      type: Sequelize.STRING(50),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    ParentBoxCode: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    movementType: {
      type: Sequelize.ENUM('add', 'subtract'),
      allowNull: false,
    },
    BoxPartsDemanded: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of {BoxPartCode: string, demand: number}'
    }
  });

  return BoxMovement;
};
