module.exports = (app) => {
  const ticketCodeController = require("../controllers/ticketCode.controller");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  router.post("/create", [authJwt.verifyToken], ticketCodeController.createWithSuffix);

  router.get("/ticket-code", [authJwt.verifyToken], ticketCodeController.findAll);

  router.get("/check-hu-unique", [authJwt.verifyToken], ticketCodeController.checkHuUnique);

  router.put("/:id", [authJwt.verifyToken], ticketCodeController.update);

  router.delete("/:id", [authJwt.verifyToken], ticketCodeController.delete);

  router.get("/shift-report", [authJwt.verifyToken], ticketCodeController.shiftReport);

  router.get("/shift-report/excel", [authJwt.verifyToken], ticketCodeController.shiftReportExcel);

  app.use("/api/ticketscode", router);
};
