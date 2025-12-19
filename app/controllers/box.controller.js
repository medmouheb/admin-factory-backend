const db = require("../models");
const Box = db.box;
const BoxPiece = db.boxPiece;
const BoxType = db.boxType;
const BoxTypePiece = db.boxTypePiece;

exports.create = async (req, res) => {
  const { boxtypeCode, matricule, pieces } = req.body;

  if (!boxtypeCode || !pieces) {
    return res.status(400).send({ message: "Content cannot be empty!" });
  }

  try {
    // 1. Verify BoxType exists
    const boxType = await BoxType.findOne({ 
      where: { code: boxtypeCode },
      include: ["pieces"] 
    });

    if (!boxType) {
      return res.status(404).send({ message: "BoxType not found!" });
    }

    // 2. Validate pieces and prepare updates
    // pieces: [{ idPiece, count }]
    // boxType.pieces: [{ refId, totalCount, ... }]
    
    // We need to map through the input pieces and perform checks
    const updates = [];
    const newBoxPieces = [];

    for (const p of pieces) {
      const typePiece = boxType.pieces.find(tp => tp.refId === p.idPiece);
      
      if (!typePiece) {
        return res.status(400).send({ 
          message: `Piece with id ${p.idPiece} does not exist in BoxType ${boxtypeCode}` 
        });
      }

      // Prepare Update
      updates.push({
        boxTypePieceId: typePiece.id,
        newTotalCount: typePiece.totalCount + p.count
      });

      // Prepare BoxPiece creation
      newBoxPieces.push({
        idPiece: p.idPiece,
        count: p.count
        // boxId will be added after box creation
      });
    }

    // 3. Create Box
    const box = await Box.create({
      boxtypeCode,
      matricule,
      // createdAt is automatic
    });

    // 4. Create BoxPieces
    const boxPiecesWithId = newBoxPieces.map(bp => ({ ...bp, boxId: box.id }));
    await BoxPiece.bulkCreate(boxPiecesWithId);

    // 5. Update BoxType pieces totalCount
    for (const update of updates) {
      await BoxTypePiece.update(
        { totalCount: update.newTotalCount },
        { where: { id: update.boxTypePieceId } }
      );
    }

    res.send({ message: "Box created and stock updated successfully!", box });

  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Box."
    });
  }
};

exports.findAll = (req, res) => {
  Box.findAll({ include: ["pieces"] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};
