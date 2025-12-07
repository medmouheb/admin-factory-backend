const { authJwt } = require("../middleware");
const controller = require("../controllers/stats.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/api/stats/parts/by-date",
    [authJwt.verifyToken],
    controller.getPartsCountByDate
  );

  app.get(
    "/api/stats/materials/by-date",
    [authJwt.verifyToken],
    controller.getMaterialsCountByDate
  );

  app.get(
    "/api/stats/tickets/by-date",
    [authJwt.verifyToken],
    controller.getTicketsCountByDate
  );

  app.get(
    "/api/stats/ticket-codes/by-date",
    [authJwt.verifyToken],
    controller.getTicketCodesCountByDate
  );

  app.get(
    "/api/stats/users/by-role",
    [authJwt.verifyToken],
    controller.getUsersByRole
  );

  app.get(
    "/api/stats/ticket-codes/by-matricule",
    [authJwt.verifyToken],
    controller.getTicketCodesStatsByMatricule
  );

  app.get(
    "/api/stats/dashboard",
    [authJwt.verifyToken],
    controller.getDashboardStats
  );
  app.get(
    "/api/stats/ticket-codes/analytics",
    [authJwt.verifyToken],
    controller.getTicketCodesAnalytics
  );
};
