module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    matricule: {
      type: Sequelize.STRING,
      unique: true
    },
    firstName: {
      type: Sequelize.STRING
    },
    lastName: {
      type: Sequelize.STRING
    },
    phone: {
      type: Sequelize.STRING
    },
    role: {
      type: Sequelize.STRING // 'operateur', 'superviseur', 'admin'
    },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    }
  });

  return User;
};
