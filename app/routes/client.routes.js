module.exports = (app) => {
  const controller = require("../controllers/client.controller");
  const router = require("express").Router();

  router.post("/create", controller.create);
  router.get("/search", controller.findAll);
  router.get("/getone/:id", controller.findOne);
  router.put("/update/:id", controller.update);
  router.patch("/archive/:id", controller.archive);
  router.patch("/active/:id", controller.active);
  router.delete("/delete/:id", controller.delete);

  app.use("/api/clients", router);
};
