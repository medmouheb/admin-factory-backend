module.exports = app => {
  const parts = require("../controllers/part.controller.js");
  const router = require("express").Router();

  router.post("/", parts.create);
  router.get("/", parts.findAll);
  router.get("/search", parts.search);
  router.get("/findById/:id", parts.findOne);
  router.put("/:id", parts.update);
  router.delete("/:id", parts.delete);
  router.get("/lear", parts.getByLearPN);

  app.use("/api/parts", router);
};
