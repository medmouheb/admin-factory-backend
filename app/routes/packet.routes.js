module.exports = app => {
    const packets = require("../controllers/packet.controller.js");
    const pieces = require("../controllers/piece.controller.js");
    var router = require("express").Router();

    const { authJwt } = require("../middleware");

    // Create a new Packet
    router.post("/", packets.create);

    // Retrieve all Packets
    router.get("/", packets.findAll);

    // Retrieve a single Packet with id
    router.get("/:id", [authJwt.verifyToken], packets.findOne);

    // Update a Packet with id
    router.put("/:id", [authJwt.verifyToken], packets.update);

    // Transfer Packet
    router.post("/transfer", [authJwt.verifyToken], packets.transfer);
    router.post("/:id/transfer", [authJwt.verifyToken], packets.transfer);

    // Receive Packet
    router.post("/receive", [authJwt.verifyToken], packets.receive);
    router.post("/:id/receive", [authJwt.verifyToken], packets.receive);

    // Return Packet
    router.post("/:id/return", [authJwt.verifyToken], packets.returnPacket);

    // Accept Return
    router.post("/:id/accept-return", [authJwt.verifyToken], packets.acceptReturn);

    // --- Piece Routes nested under Packet ---

    // Add a Piece to a Packet
    router.post("/:packetId/pieces", [authJwt.verifyToken], pieces.addPiece);

    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.use('/api/packets', router);
};

