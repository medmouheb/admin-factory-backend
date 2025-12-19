module.exports = (sequelize, Sequelize) => {
  const Box = sequelize.define("box", {
    boxtypeCode: {
      type: Sequelize.STRING
    },
    matricule: {
      type: Sequelize.STRING
    }
  });

  return Box;
};
