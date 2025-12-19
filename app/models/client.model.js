module.exports = (sequelize, Sequelize) => {
  const Client = sequelize.define("clients", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: Sequelize.STRING,
    },
    address: {
      type: Sequelize.STRING,
    },
    latitude: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    archived: {
      type: Sequelize.BOOLEAN,
      defaultValue: false, // false = active, true = archived
    },
  });

  return Client;
};
