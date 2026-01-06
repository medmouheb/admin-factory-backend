module.exports = (app) => {
  const parentBox = require("../controllers/parentBox.controller.js");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  // Create new ParentBox
  router.post("/", [authJwt.verifyToken], parentBox.create);

  // Get all ParentBoxes
  router.get("/", [authJwt.verifyToken], parentBox.findAll);

  // Search ParentBoxes
  router.get("/search", [authJwt.verifyToken], parentBox.search);

  // Get ParentBox by ParentBoxCode
  router.get("/code/:code", [authJwt.verifyToken], parentBox.getByCode);

  // Get ParentBox by ID
  router.get("/:id", [authJwt.verifyToken], parentBox.findOne);

  // Update ParentBox
  router.put("/:id", [authJwt.verifyToken], parentBox.update);

  // Delete ParentBox
  router.delete("/:id", [authJwt.verifyToken], parentBox.delete);

  app.use("/api/parentbox", router);
};
