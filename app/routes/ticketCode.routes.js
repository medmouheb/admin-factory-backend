module.exports = (app) => {
  const ticketCodeController = require("../controllers/ticketCode.controller");
  const router = require("express").Router();

  router.post("/creat", ticketCodeController.createWithSuffix);


  app.use("/api/ticketscode", router);
};
