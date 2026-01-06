const upload = require("../middleware/uploadBoxPartPicture");

module.exports = (app) => {
  const boxPart = require("../controllers/boxPart.controller.js");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  // Create new BoxPart (with optional picture upload)
  router.post("/", [authJwt.verifyToken, upload.single("picture")], boxPart.create);

  // Get all BoxParts
  router.get("/", [authJwt.verifyToken], boxPart.findAll);

  // Search BoxParts
  router.get("/search", [authJwt.verifyToken], boxPart.search);

  // Get BoxPart picture by BoxPartCode
  router.get("/picture/:code", [authJwt.verifyToken], boxPart.getPicture);

  // Get BoxPart by BoxPartCode
  router.get("/code/:code", [authJwt.verifyToken], boxPart.getByCode);

  // Get BoxPart by ID
  router.get("/:id", [authJwt.verifyToken], boxPart.findOne);

  // Update BoxPart (with optional picture upload)
  router.put("/:id", [authJwt.verifyToken, upload.single("picture")], boxPart.update);

  // Delete BoxPart
  router.delete("/:id", [authJwt.verifyToken], boxPart.delete);

  app.use("/api/boxpart", router);
};
