module.exports = (app) => {
    const qualityInspection = require("../controllers/qualityInspection.controller.js");
    const { authJwt } = require("../middleware");
    var router = require("express").Router();

    // Create a new QualityInspection
    router.post("/", [authJwt.verifyToken], qualityInspection.create);

    // Retrieve all QualityInspections
    router.get("/", [authJwt.verifyToken], qualityInspection.findAll);

    // Retrieve a single QualityInspection with id
    router.get("/:id", [authJwt.verifyToken], qualityInspection.findOne);

    // Update a QualityInspection with id
    router.put("/:id", [authJwt.verifyToken], qualityInspection.update);

    // Delete a QualityInspection with id
    router.delete("/:id", [authJwt.verifyToken], qualityInspection.delete);

    app.use('/api/quality-inspections', router);
};
