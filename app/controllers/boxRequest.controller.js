const db = require("../models");
const BoxRequest = db.boxRequest;
const BoxType = db.boxType;
const BoxTypePiece = db.boxTypePiece;

exports.create = async (req, res) => {
  const { boxtypeCode, matricule, demandNumber } = req.body;

  if (!boxtypeCode || !matricule || !demandNumber) {
    return res.status(400).send({ message: "Content cannot be empty!" });
  }

  try {
    // 1. Create Request
    const boxRequest = await BoxRequest.create({
      boxtypeCode,
      matricule,
      demandNumber,
      status: 'pending'
    });

    // 2. Update BoxType Demand (Reserved stock)
    // Find BoxType
    const boxType = await BoxType.findOne({ 
      where: { code: boxtypeCode },
      include: ["pieces"] 
    });

    if (boxType && boxType.pieces) {
      for (const piece of boxType.pieces) {
        await BoxTypePiece.update(
          { demandNumber: piece.demandNumber + demandNumber },
          { where: { id: piece.id } }
        );
      }
    }

    // Emit notification (simulated)
    // io.to(matricule).emit('notification', { message: 'New Box Request', request: boxRequest });

    res.send(boxRequest);

  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the BoxRequest."
    });
  }
};

exports.findAll = (req, res) => {
  BoxRequest.findAll()
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

// Validate request and update stock
exports.validateRequest = async (req, res) => {
  const id = req.params.id;

  try {
    const request = await BoxRequest.findByPk(id);
    if (!request) {
      return res.status(404).send({ message: "Request not found" });
    }

    if (request.status === 'validated') {
      return res.status(400).send({ message: "Request already validated" });
    }

    // Find BoxType to update stock
    const boxType = await BoxType.findOne({ 
      where: { code: request.boxtypeCode },
      include: ["pieces"] 
    });

    if (!boxType) {
      return res.status(404).send({ message: "Associated BoxType not found" });
    }

    // Logic:
    // 1. Decrease 'demandNumber' (reservation is now fulfilled)
    // 2. Decrease 'totalCount' (stock is consumed)
    
    for (const piece of boxType.pieces) {
      const newTotalCount = piece.totalCount - request.demandNumber;
      const newDemandNumber = piece.demandNumber - request.demandNumber;

      await BoxTypePiece.update(
        { 
          totalCount: newTotalCount < 0 ? 0 : newTotalCount,
          demandNumber: newDemandNumber < 0 ? 0 : newDemandNumber
        },
        { where: { id: piece.id } }
      );
    }


    // Update status
    request.status = 'validated';
    await request.save();

    res.send({ message: "Request validated and stock updated.", request });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
