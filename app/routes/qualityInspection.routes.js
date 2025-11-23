module.exports = (app) => {
    const qualityInspection = require("../controllers/qualityInspection.controller.js");
    var router = require("express").Router();

    // Create a new QualityInspection
    router.post("/", qualityInspection.create);

    // Retrieve all QualityInspections
    router.get("/", qualityInspection.findAll);

    // Retrieve a single QualityInspection with id
    router.get("/:id", qualityInspection.findOne);

    // Update a QualityInspection with id
    router.put("/:id", qualityInspection.update);

    // Delete a QualityInspection with id
    router.delete("/:id", qualityInspection.delete);

    app.use('/api/quality-inspections', router);
};
