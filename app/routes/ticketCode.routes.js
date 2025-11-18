module.exports = (app) => {
  const ticketCodeController = require("../controllers/ticketCode.controller");
  const router = require("express").Router();

  router.post("/creat", ticketCodeController.createWithSuffix);

router.get("/ticket-code", ticketCodeController.findAll);   // <= search + pagination

  app.use("/api/ticketscode", router);
};
