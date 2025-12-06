module.exports = (app) => {
  const controller = require("../controllers/client.controller");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  router.post("/create", [authJwt.verifyToken], controller.create);
  router.get("/search", [authJwt.verifyToken], controller.findAll);
  router.get("/getone/:id", [authJwt.verifyToken], controller.findOne);
  router.put("/update/:id", [authJwt.verifyToken], controller.update);
  router.patch("/archive/:id", [authJwt.verifyToken], controller.archive);
  router.patch("/active/:id", [authJwt.verifyToken], controller.active);
  router.delete("/delete/:id", [authJwt.verifyToken], controller.delete);

  app.use("/api/clients", router);
};
