const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/user.model.js")(sequelize, Sequelize);
// db.role = require("../models/role.model.js")(sequelize, Sequelize);
db.material = require("../models/material.model.js")(sequelize, Sequelize);
db.part = require("../models/part.model.js")(sequelize, Sequelize);
db.ticket = require("../models/ticket.model.js")(sequelize, Sequelize);
db.ticketCode = require("../models/ticketCode.model.js")(sequelize, Sequelize);
db.client = require("../models/client.model.js")(sequelize, Sequelize);
db.reapirage = undefined; // Remove old reference if needed, or just overwrite
db.retouching = require("../models/retouching.model.js")(sequelize, Sequelize);
db.qualityInspection = require("../models/qualityInspection.model.js")(sequelize, Sequelize);
db.packets = require("./packet.model.js")(sequelize, Sequelize);
db.pieces = require("./piece.model.js")(sequelize, Sequelize);
db.history = require("../models/history.model.js")(sequelize, Sequelize);




db.packets.hasMany(db.pieces, { as: "pieces" });
db.pieces.belongsTo(db.packets, {
  foreignKey: "packetId",
  as: "packet",
});

// db.role.belongsToMany(db.user, {
//   through: "user_roles"
// });
// db.user.belongsToMany(db.role, {
//   through: "user_roles"
// });

db.history.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user"
});

db.ROLES = ["operateur", "superviseur", "admin"];
db.AccessTos = ["scan", "upload", "clients"];

module.exports = db;
