module.exports = app => {
  const materials = require("../controllers/material.controller.js");
  const router = require("express").Router();

  router.post("/", materials.create);
  router.get("/", materials.findAll);
  router.get("/search", materials.search);
  router.get("/getById", materials.findOne);
  router.put("/:id", materials.update);
  router.delete("/:id", materials.delete);
  router.get("/code", materials.getByMaterial);

  app.use("/api/materials", router);
};
