const { authJwt } = require("../middleware");
const history = require("../controllers/history.controller.js");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.get(
        "/api/history",
        [authJwt.verifyToken],
        history.findAll
    );
};
