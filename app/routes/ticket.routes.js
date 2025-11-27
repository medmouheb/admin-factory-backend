module.exports = (app) => {
  const ticketController = require("../controllers/ticket.controller");
  const router = require("express").Router();

  router.post("/", ticketController.create);

  // Bulk create (list)
  router.post("/bulk", ticketController.bulkCreate);

  // Get all
  router.get("/search", ticketController.findAll);

  // Get one by ID
  router.get("/getbyid/:id", ticketController.findOne);

  // Delete one
  router.delete("/:id", ticketController.delete);

  // Check if barcode exists
  router.get("/check/:barcode", ticketController.checkBarcode);

  app.use("/api/tickets", router);
};
