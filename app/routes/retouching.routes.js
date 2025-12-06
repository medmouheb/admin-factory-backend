module.exports = (app) => {
    const retouching = require("../controllers/retouching.controller.js");
    const { authJwt } = require("../middleware");
    var router = require("express").Router();

    // Create a new Retouching
    router.post("/", [authJwt.verifyToken], retouching.create);

    // Retrieve all Retouchings
    router.get("/", [authJwt.verifyToken], retouching.findAll);

    // Retrieve a single Retouching with id
    router.get("/:id", [authJwt.verifyToken], retouching.findOne);

    // Update a Retouching with id
    router.put("/:id", [authJwt.verifyToken], retouching.update);

    // Delete a Retouching with id
    router.delete("/:id", [authJwt.verifyToken], retouching.delete);

    app.use('/api/retouchings', router);
};
