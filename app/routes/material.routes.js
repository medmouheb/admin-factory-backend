const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

module.exports = app => {
  const materials = require("../controllers/material.controller.js");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  router.post("/", [authJwt.verifyToken], materials.create);
  router.get("/", [authJwt.verifyToken], materials.findAll);
  router.get("/search", [authJwt.verifyToken], materials.search);
  router.get("/getById", [authJwt.verifyToken], materials.findOne);
  router.put("/:id", [authJwt.verifyToken], materials.update);
  router.delete("/:id", [authJwt.verifyToken], materials.delete);
  router.get("/code", [authJwt.verifyToken], materials.getByMaterial);
  router.get("/storageunit", [authJwt.verifyToken], materials.getByStoargeUnit);
  
  // Export to Excel (with date range)
  router.get("/export", [authJwt.verifyToken], materials.exportToExcel);
  
  // Import from Excel
  router.post("/import", [authJwt.verifyToken, upload.single("file")], materials.importFromExcel);

  app.use("/api/materials", router);
};
