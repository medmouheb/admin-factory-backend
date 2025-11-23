const db = require("../models");
const Piece = db.pieces;
const Packet = db.packets;

// Add a Piece to a Packet
exports.addPiece = (req, res) => {
    const packetId = req.params.packetId;

    if (!req.body.barcode) {
        return res.status(400).send({ message: "Barcode is required" });
    }

    const piece = {
        barcode: req.body.barcode,
        status: req.body.status || 'OK',
        packetId: packetId
    };

    Piece.create(piece)
        .then(data => {
            // Increment packet quantity
            Packet.increment('quantity', { where: { id: packetId } });
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Error adding piece."
            });
        });
};

// Update Piece Status
exports.updatePiece = (req, res) => {
    const id = req.params.id;

    Piece.update(req.body, { where: { id: id } })
        .then(num => {
            if (num == 1) res.send({ message: "Piece updated successfully." });
            else res.send({ message: `Cannot update Piece with id=${id}.` });
        })
        .catch(err => res.status(500).send({ message: "Error updating Piece." }));
};

// Remove a Piece
exports.deletePiece = (req, res) => {
    const id = req.params.id;

    // First find the piece to know which packet it belongs to (to decrement qty)
    Piece.findByPk(id)
        .then(piece => {
            if (!piece) {
                return res.status(404).send({ message: "Piece not found" });
            }

            const packetId = piece.packetId;

            Piece.destroy({ where: { id: id } })
                .then(num => {
                    if (num == 1) {
                        // Decrement packet quantity
                        Packet.decrement('quantity', { where: { id: packetId } });
                        res.send({ message: "Piece deleted successfully!" });
                    } else {
                        res.send({ message: `Cannot delete Piece with id=${id}.` });
                    }
                });
        })
        .catch(err => res.status(500).send({ message: "Could not delete Piece." }));
};