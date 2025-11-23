module.exports = app => {
    const packets = require("../controllers/packet.controller.js");
    const pieces = require("../controllers/piece.controller.js");
    var router = require("express").Router();

    // Create a new Packet
    router.post("/", packets.create);

    // Retrieve all Packets
    router.get("/", packets.findAll);

    // Retrieve a single Packet with id
    router.get("/:id", packets.findOne);

    // Update a Packet with id
    router.put("/:id", packets.update);

    // Transfer Packet
    router.post("/:id/transfer", packets.transfer);

    // Receive Packet
    router.post("/:id/receive", packets.receive);

    // Return Packet
    router.post("/:id/return", packets.returnPacket);

    // Accept Return
    router.post("/:id/accept-return", packets.acceptReturn);

    // --- Piece Routes nested under Packet ---

    // Add a Piece to a Packet
    router.post("/:packetId/pieces", pieces.addPiece);

    app.use('/api/packets', router);
};

