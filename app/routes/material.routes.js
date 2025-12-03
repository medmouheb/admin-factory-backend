const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

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
  router.get("/storageunit", materials.getByStoargeUnit);
  
  // Export to Excel (with date range)
  router.get("/export", materials.exportToExcel);
  
  // Import from Excel
  router.post("/import", upload.single("file"), materials.importFromExcel);

  app.use("/api/materials", router);
};
