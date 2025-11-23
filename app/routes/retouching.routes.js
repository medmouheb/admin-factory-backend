module.exports = (app) => {
    const retouching = require("../controllers/retouching.controller.js");
    var router = require("express").Router();

    // Create a new Retouching
    router.post("/", retouching.create);

    // Retrieve all Retouchings
    router.get("/", retouching.findAll);

    // Retrieve a single Retouching with id
    router.get("/:id", retouching.findOne);

    // Update a Retouching with id
    router.put("/:id", retouching.update);

    // Delete a Retouching with id
    router.delete("/:id", retouching.delete);

    app.use('/api/retouchings', router);
};
