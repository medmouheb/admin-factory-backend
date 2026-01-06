module.exports = (app) => {
  const boxMovement = require("../controllers/boxMovement.controller.js");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  // Create new BoxMovement
  router.post("/", [authJwt.verifyToken], boxMovement.create);

  // Get all BoxMovements
  router.get("/", [authJwt.verifyToken], boxMovement.findAll);

  // Search BoxMovements
  router.get("/search", [authJwt.verifyToken], boxMovement.search);

  // Get BoxMovements by ParentBoxCode
  router.get("/parentbox/:code", [authJwt.verifyToken], boxMovement.getByParentBoxCode);

  // Get BoxMovement by ID
  router.get("/:id", [authJwt.verifyToken], boxMovement.findOne);

  // Update BoxMovement
  router.put("/:id", [authJwt.verifyToken], boxMovement.update);

  // Delete BoxMovement
  router.delete("/:id", [authJwt.verifyToken], boxMovement.delete);

  app.use("/api/boxmovement", router);
};
