module.exports = (app) => {
    const huGalia = require("../controllers/huGalia.controller.js");
    const { authJwt } = require("../middleware");
    var router = require("express").Router();

    router.post("/", [authJwt.verifyToken], huGalia.create);
    router.get("/", [authJwt.verifyToken], huGalia.findAll);
    router.get("/:id", [authJwt.verifyToken], huGalia.findOne);
    router.put("/:id", [authJwt.verifyToken], huGalia.update);
    router.delete("/:id", [authJwt.verifyToken], huGalia.delete);

    app.use('/api/hu-galias', router);
};
