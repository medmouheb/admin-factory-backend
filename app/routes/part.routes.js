const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

module.exports = app => {
  const parts = require("../controllers/part.controller.js");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  router.post("/", [authJwt.verifyToken], parts.create);
  router.get("/", [authJwt.verifyToken], parts.findAll);
  router.get("/search", [authJwt.verifyToken], parts.search);
  router.get("/findById/:id", [authJwt.verifyToken], parts.findOne);
  router.put("/:id", [authJwt.verifyToken], parts.update);
  router.delete("/:id", [authJwt.verifyToken], parts.delete);
  router.get("/lear", [authJwt.verifyToken], parts.getByLearPN);
  
  // Export to Excel (with date range)
  router.get("/export", [authJwt.verifyToken], parts.exportToExcel);
  
  // Import from Excel
  router.post("/import", [authJwt.verifyToken, upload.single("file")], parts.importFromExcel);

  app.use("/api/parts", router);
};
