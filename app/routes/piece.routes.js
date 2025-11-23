module.exports = app => {
    const pieces = require("../controllers/piece.controller.js");
    var router = require("express").Router();

    // Update a Piece with id
    router.put("/:id", pieces.updatePiece);

    // Delete a Piece with id
    router.delete("/:id", pieces.deletePiece);

    app.use('/api/pieces', router);
};

