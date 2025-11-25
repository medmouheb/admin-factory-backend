const db = require("../models");
// const ROLES = db.ROLES; // Removed
const User = db.user;

checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Matricule
  User.findOne({
    where: {
      matricule: req.body.matricule
    }
  }).then(user => {
    if (user) {
      res.status(400).send({
        message: "Failed! Matricule is already in use!"
      });
      return;
    }

    // Email
    User.findOne({
      where: {
        email: req.body.email
      }
    }).then(user => {
      if (user) {
        res.status(400).send({
          message: "Failed! Email is already in use!"
        });
        return;
      }

      next();
    });
  });
};

checkRolesExisted = (req, res, next) => {
  if (req.body.role) {
    if (!["operateur", "superviseur", "admin"].includes(req.body.role)) {
      res.status(400).send({
        message: "Failed! Role does not exist = " + req.body.role
      });
      return;
    }
  }
  
  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
  checkRolesExisted: checkRolesExisted
};

module.exports = verifySignUp;
