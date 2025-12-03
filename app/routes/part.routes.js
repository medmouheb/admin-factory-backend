const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

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
  
  // Export to Excel (with date range)
  router.get("/export", parts.exportToExcel);
  
  // Import from Excel
  router.post("/import", upload.single("file"), parts.importFromExcel);

  app.use("/api/parts", router);
};
