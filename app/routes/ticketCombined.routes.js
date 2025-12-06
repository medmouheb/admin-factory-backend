module.exports = (app) => {
  const ticketCombinedController = require("../controllers/ticketCombined.controller");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  // Export combined Ticket and TicketCode data to Excel
  router.get("/export", [authJwt.verifyToken], ticketCombinedController.exportCombinedToExcel);

  app.use("/api/tickets-combined", router);
};
