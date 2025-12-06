const db = require("../models");
const Log = db.log;
const User = db.user;

exports.logAction = async (userId, modelName, action, previousData, currentData) => {
  try {
    let matricule = null;

    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        matricule = user.matricule || null;
      }
    }

    await Log.create({
      matricule: matricule, 
      model: modelName,
      action: action,
      previousData: previousData ? JSON.stringify(previousData) : null,
      currentData: currentData ? JSON.stringify(currentData) : null
    });
  } catch (error) {
    console.error("Logging failed:", error);
  }
};
