const db = require("../models");
const BoxType = db.boxType;
const BoxTypePiece = db.boxTypePiece;
const fs = require('fs');
const path = require('path');

// Helper to handle file mapping
const mapFilesToPieces = (pieces, files) => {
  if (!pieces || !files) return pieces;
  
  // Expecting field names like "piece_0", "piece_1" corresponding to array index
  files.forEach(file => {
    const parts = file.fieldname.split('_');
    if (parts.length === 2 && parts[0] === 'piece') {
      const index = parseInt(parts[1]);
      if (!isNaN(index) && pieces[index]) {
        pieces[index].picture = file.filename;
      }
    }
  });
  return pieces;
};

exports.create = (req, res) => {
  // Parsing pieces if sent as JSON string (common in multipart/form-data)
  let pieces = [];
  if (req.body.pieces) {
    try {
      pieces = typeof req.body.pieces === 'string' ? JSON.parse(req.body.pieces) : req.body.pieces;
    } catch (e) {
      return res.status(400).send({ message: "Invalid JSON format for pieces" });
    }
  }

  // Handle file uploads
  if (req.files) {
    pieces = mapFilesToPieces(pieces, req.files);
  }

  if (!req.body.code) {
    return res.status(400).send({ message: "Content can not be empty!" });
  }

  const boxType = {
    code: req.body.code,
    description: req.body.description
  };

  BoxType.create(boxType)
    .then(data => {
      if (pieces && pieces.length > 0) {
        const mappedPieces = pieces.map(piece => ({
          ...piece,
          refId: piece.id, // map input 'id' to 'refId' if needed, though usually 'id' is DB pk.
                           // If user sends 'id' as their own reference, store in refId.
          boxTypeId: data.id,
          picture: piece.picture || null
        }));
        
        BoxTypePiece.bulkCreate(mappedPieces)
          .then(() => {
            BoxType.findByPk(data.id, { include: ["pieces"] })
              .then(result => res.send(result))
              .catch(err => res.status(500).send({ message: err.message }));
          })
          .catch(err => {
             res.status(500).send({ message: err.message || "Error creating pieces." });
          });
      } else {
        res.send(data);
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Error creating BoxType." });
    });
};

exports.update = async (req, res) => {
  const id = req.params.id;
  
  // Parse pieces if present
  let pieces = [];
  if (req.body.pieces) {
    try {
      pieces = typeof req.body.pieces === 'string' ? JSON.parse(req.body.pieces) : req.body.pieces;
    } catch (e) {
      return res.status(400).send({ message: "Invalid JSON format for pieces" });
    }
  }

  // Handle file uploads for update
  if (req.files) {
    pieces = mapFilesToPieces(pieces, req.files);
  }

  try {
    const boxType = await BoxType.findByPk(id);
    if (!boxType) {
      return res.status(404).send({ message: "BoxType not found" });
    }

    // Update BoxType details
    if (req.body.code) boxType.code = req.body.code;
    if (req.body.description) boxType.description = req.body.description;
    await boxType.save();

    // Update Pieces
    // Strategy: Upsert based on ID. 
    // If piece has ID, update it. If not, create it.
    // Note: We do NOT delete missing pieces automatically to preserve stock data/history unless explicitly requested.
    
    if (pieces && pieces.length > 0) {
      for (const p of pieces) {
        if (p.id) {
          // Update existing
          // Ensure it belongs to this boxType
          await BoxTypePiece.update(
            { 
              description: p.description, 
              // Only update picture if a new one is provided
              ...(p.picture ? { picture: p.picture } : {}),
              // Do NOT update totalCount or demandNumber here usually, unless admin override
            },
            { where: { id: p.id, boxTypeId: id } }
          );
        } else {
          // Create new
          await BoxTypePiece.create({
            ...p,
            boxTypeId: id,
            refId: p.refId || p.id, // Fallback
          });
        }
      }
    }

    const updatedBoxType = await BoxType.findByPk(id, { include: ["pieces"] });
    res.send(updatedBoxType);

  } catch (err) {
    res.status(500).send({ message: "Error updating BoxType: " + err.message });
  }
};

exports.delete = (req, res) => {
  const id = req.params.id;

  BoxType.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        // Optionally delete associated pieces if not cascading?
        // Sequelize 'onDelete: CASCADE' in association would handle this.
        // If not set, we might have orphans. Assuming relation set or DB handles it.
        // We can manually delete to be sure:
        BoxTypePiece.destroy({ where: { boxTypeId: id } }).catch(err => console.log('Error deleting pieces', err));
        
        res.send({ message: "BoxType was deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete BoxType with id=${id}. Maybe BoxType was not found!` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete BoxType with id=" + id });
    });
};

exports.findAll = (req, res) => {
  BoxType.findAll({ include: ["pieces"] })
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  BoxType.findByPk(id, { include: ["pieces"] })
    .then(data => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find BoxType with id=${id}.` });
    })
    .catch(err => res.status(500).send({ message: "Error retrieving BoxType with id=" + id }));
};

exports.findOneByCode = (req, res) => {
  const code = req.params.code;
  BoxType.findOne({ where: { code: code }, include: ["pieces"] })
    .then(data => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find BoxType with code=${code}.` });
    })
    .catch(err => res.status(500).send({ message: "Error retrieving BoxType with code=" + code }));
};
