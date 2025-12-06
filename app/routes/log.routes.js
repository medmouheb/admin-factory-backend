module.exports = app => {
  const logs = require("../controllers/log.controller.js");
  const { authJwt } = require("../middleware");
  const router = require("express").Router();

  // Retrieve all Logs with filtering and pagination
  router.get("/", [authJwt.verifyToken], logs.findAll);

  app.use("/api/logs", router);
};
