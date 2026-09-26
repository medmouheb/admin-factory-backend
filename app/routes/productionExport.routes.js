const { authJwt } = require("../middleware");
const controller = require("../controllers/productionExport.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "x-access-token, Origin, Content-Type, Accept");
    next();
  });

  /**
   * GET /api/production-export/preview
   * Query params :
   *   type      : "shift" | "day" | "week" | "month"
   *   date      : "YYYY-MM-DD"  (pour shift / day)
   *   shift     : "morning" | "afternoon" | "night"  (si type=shift)
   *   weekStart : "YYYY-MM-DD"  (si type=week)
   *   month     : "YYYY-MM"     (si type=month)
   */
  app.get(
    "/api/production-export/preview",
    [authJwt.verifyToken],
    controller.preview
  );

  /**
   * GET /api/production-export/excel
   * Mêmes query params que /preview — déclenche le téléchargement
   */
  app.get(
    "/api/production-export/excel",
    [authJwt.verifyToken],
    controller.exportExcel
  );
};
