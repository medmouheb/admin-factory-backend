module.exports = app => {
    const pieces = require("../controllers/piece.controller.js");
    const { authJwt } = require("../middleware");
    var router = require("express").Router();

    // Update a Piece with id
    router.put("/:id", [authJwt.verifyToken], pieces.updatePiece);

    // Delete a Piece with id
    router.delete("/:id", [authJwt.verifyToken], pieces.deletePiece);

    app.use('/api/pieces', router);
};

