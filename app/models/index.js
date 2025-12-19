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
db.log = require("../models/log.model.js")(sequelize, Sequelize);




db.packets.hasMany(db.pieces, { as: "pieces", foreignKey: "packetId" });
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

db.log.belongsTo(db.user, {
  foreignKey: "matricule",
  targetKey: "matricule",
  as: "user"
});

db.boxType = require("../models/boxType.model.js")(sequelize, Sequelize);
db.boxTypePiece = require("../models/boxTypePiece.model.js")(sequelize, Sequelize);
db.box = require("../models/box.model.js")(sequelize, Sequelize);
db.boxPiece = require("../models/boxPiece.model.js")(sequelize, Sequelize);
db.boxRequest = require("../models/boxRequest.model.js")(sequelize, Sequelize);

// Associations for BoxType
db.boxType.hasMany(db.boxTypePiece, { as: "pieces", foreignKey: "boxTypeId" });
db.boxTypePiece.belongsTo(db.boxType, {
  foreignKey: "boxTypeId",
  as: "boxType",
});

// Associations for Box
db.box.hasMany(db.boxPiece, { as: "pieces", foreignKey: "boxId" });
db.boxPiece.belongsTo(db.box, {
  foreignKey: "boxId",
  as: "box",
});
// Optional: box belongs to boxtype by code? Or just loose coupling as per user schema (boxtypeCode string)
// We can strictly associate if we want, but user Schema has `boxtypeCode` string.
// Let's add a proper FK relationship for better query support if possible, or stick to manual code check.
// I'll stick to string as requested but using boxType object ensures referential integrity. 
// Given the user instruction "Verification", I will do it manually in controller or via hook.

// BoxRequest
db.boxRequest.belongsTo(db.boxType, { foreignKey: 'boxtypeCode', targetKey: 'code', as: 'boxtype' }); // If possible.


db.ROLES = ["operateur", "superviseur", "admin"];
db.AccessTos = ["scan", "upload", "clients"];

module.exports = db;
