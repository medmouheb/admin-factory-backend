const controller = require("../controllers/boxRequest.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/boxrequest", controller.create);
  app.get("/api/boxrequest", controller.findAll);
  app.put("/api/boxrequest/:id/validate", controller.validateRequest);
};
