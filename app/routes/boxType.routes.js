const controller = require("../controllers/boxType.controller");
const { upload } = require("../middleware");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/boxtype", upload, controller.create);
  app.get("/api/boxtype", controller.findAll);
  app.get("/api/boxtype/:id", controller.findOne);
  app.put("/api/boxtype/:id", upload, controller.update); // Add Update
  app.delete("/api/boxtype/:id", controller.delete); // Add Delete
  app.get("/api/boxtype/code/:code", controller.findOneByCode);
};
