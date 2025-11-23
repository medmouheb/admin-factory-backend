const db = require("../models");
const Packet = db.packets;
const Piece = db.pieces;
const Op = db.Sequelize.Op;

// Create and Save a new Packet
exports.create = (req, res) => {
    // Validate request
    if (!req.body.packetId || !req.body.huGalia) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const packet = {
        packetId: req.body.packetId,
        huGalia: req.body.huGalia,
        location: req.body.location || '354D',
        status: req.body.status || 'Ready for Transfer',
        quantity: req.body.quantity || 0,
        date: req.body.date || new Date()
    };

    Packet.create(packet)
        .then(data => {
            // If pieces are provided in the request, create them too
            if (req.body.pieces && req.body.pieces.length > 0) {
                const pieces = req.body.pieces.map(p => ({ ...p, packetId: data.id }));
                Piece.bulkCreate(pieces)
                    .then(() => {
                        // Return packet with pieces
                        Packet.findByPk(data.id, { include: ["pieces"] })
                            .then(result => res.send(result));
                    });
            } else {
                res.send(data);
            }
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Packet."
            });
        });
};

// Retrieve all Packets (with filtering support)
exports.findAll = (req, res) => {
    const { search, date, status, location } = req.query;
    let condition = {};

    // Search by Packet ID or HU Galia
    if (search) {
        condition[Op.or] = [
            { packetId: { [Op.like]: `%${search}%` } },
            { huGalia: { [Op.like]: `%${search}%` } }
        ];
    }

    if (date) condition.date = date;
    if (status && status !== 'all') condition.status = status;
    if (location) condition.location = location;

    Packet.findAll({
        where: condition,
        include: ["pieces"], // Include associated pieces
        order: [['updatedAt', 'DESC']]
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving packets."
            });
        });
};

// Find a single Packet with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    const condition = /^\d+$/.test(id) ? { id: id } : { packetId: id };

    Packet.findOne({ where: condition, include: ["pieces"] })
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `Cannot find Packet with id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error retrieving Packet with id=" + id
            });
        });
};

// Update a Packet (General update)
exports.update = (req, res) => {
    const id = req.params.id;
    const condition = /^\d+$/.test(id) ? { id: id } : { packetId: id };

    Packet.update(req.body, {
        where: condition
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Packet was updated successfully."
                });
            } else {
                res.send({
                    message: `Cannot update Packet with id=${id}. Maybe Packet was not found or req.body is empty!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating Packet with id=" + id
            });
        });
};

// Transfer Packet (354D -> 353A or Stock)
exports.transfer = (req, res) => {
    const id = req.params.id;
    const target = req.body.target; // '353A' or 'Stock'

    let updateData = {};
    if (target === '353A') {
        updateData = { status: 'In Transit', location: 'Transit' };
    } else if (target === 'Stock') {
        updateData = { status: 'In Stock', location: 'Stock 354D' };
    } else {
        return res.status(400).send({ message: "Invalid target specified" });
    }

    const condition = /^\d+$/.test(id) ? { id: id } : { packetId: id };

    Packet.update(updateData, { where: condition })
        .then(num => {
            if (num == 1) res.send({ message: "Packet transferred successfully." });
            else res.send({ message: `Cannot transfer Packet with id=${id}.` });
        })
        .catch(err => res.status(500).send({ message: "Error transferring Packet." }));
};

// Receive Packet at 353A
exports.receive = (req, res) => {
    const id = req.params.id;
    const condition = /^\d+$/.test(id) ? { id: id } : { packetId: id };

    Packet.update({ status: 'Received', location: '353A' }, { where: condition })
        .then(num => {
            if (num == 1) res.send({ message: "Packet received successfully." });
            else res.send({ message: `Cannot receive Packet with id=${id}.` });
        })
        .catch(err => res.status(500).send({ message: "Error receiving Packet." }));
};

// Return Packet (353A -> 354D)
exports.returnPacket = (req, res) => {
    const id = req.params.id;
    const condition = /^\d+$/.test(id) ? { id: id } : { packetId: id };

    Packet.update({ status: 'Returning', location: 'Transit' }, { where: condition })
        .then(num => {
            if (num == 1) res.send({ message: "Packet returned successfully." });
            else res.send({ message: `Cannot return Packet with id=${id}.` });
        })
        .catch(err => res.status(500).send({ message: "Error returning Packet." }));
};

// Accept Return at 354D
exports.acceptReturn = (req, res) => {
    const id = req.params.id;
    const condition = /^\d+$/.test(id) ? { id: id } : { packetId: id };

    Packet.update({ status: 'Returned', location: '354D' }, { where: condition })
        .then(num => {
            if (num == 1) res.send({ message: "Return accepted successfully." });
            else res.send({ message: `Cannot accept return for Packet with id=${id}.` });
        })
        .catch(err => res.status(500).send({ message: "Error accepting return." }));
};