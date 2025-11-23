module.exports = (app) => {
    const huGalia = require("../controllers/huGalia.controller.js");
    var router = require("express").Router();

    router.post("/", huGalia.create);
    router.get("/", huGalia.findAll);
    router.get("/:id", huGalia.findOne);
    router.put("/:id", huGalia.update);
    router.delete("/:id", huGalia.delete);

    app.use('/api/hu-galias', router);
};
