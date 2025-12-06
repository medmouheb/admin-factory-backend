module.exports = (app) => {
  const ticketController = require("../controllers/ticket.controller");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  router.post("/", [authJwt.verifyToken], ticketController.create);

  // Bulk create (list)
  router.post("/bulk", [authJwt.verifyToken], ticketController.bulkCreate);

  // Get all
  router.get("/search", [authJwt.verifyToken], ticketController.findAll);

  // Get one by ID
  router.get("/getbyid/:id", [authJwt.verifyToken], ticketController.findOne);

  // Delete one
  router.delete("/:id", [authJwt.verifyToken], ticketController.delete);

  // Check if barcode exists
  router.get("/check/:barcode", [authJwt.verifyToken], ticketController.checkBarcode);

  // Update Ticket
  router.put("/:id", [authJwt.verifyToken], ticketController.update);

  // Get Ticket by Barcode
  router.get("/barcode/:barcode", [authJwt.verifyToken], ticketController.findByBarcode);

  app.use("/api/tickets", router);
};
