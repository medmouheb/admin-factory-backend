module.exports = (app) => {
  const ticketCodeController = require("../controllers/ticketCode.controller");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  router.post("/creat", [authJwt.verifyToken], ticketCodeController.createWithSuffix);

  router.get("/ticket-code", [authJwt.verifyToken], ticketCodeController.findAll);

  router.get("/check-hu-unique", [authJwt.verifyToken], ticketCodeController.checkHuUnique);

  app.use("/api/ticketscode", router);
};
